package com.banking.transaction.service;

import com.banking.transaction.client.AccountServiceClient;
import com.banking.transaction.dto.AccountStatus;
import com.banking.transaction.dto.TransactionResponse;
import com.banking.transaction.dto.TransferRequest;
import com.banking.transaction.entity.Transaction;
import com.banking.transaction.enumtype.TransactionStatus;
import com.banking.transaction.enumtype.TransactionType;
import com.banking.transaction.exception.AccountLockedException;
import com.banking.transaction.exception.InvalidOtpException;
import com.banking.transaction.exception.ResourceNotFoundException;
import com.banking.transaction.exception.TransactionNotFoundException;
import com.banking.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final AccountServiceClient accountServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public TransactionResponse transferFunds(TransferRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        if (request.getSenderAccountNumber().equals(request.getReceiverAccountNumber())) {
            throw new IllegalArgumentException("Sender and receiver accounts must be different");
        }

        String senderAccountNumber = request.getSenderAccountNumber();
        String senderLockoutKey = "lockout:account:" + senderAccountNumber;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(senderLockoutKey))) {
            throw new AccountLockedException(
                "Account is temporarily locked due to 3 failed OTP attempts. Please wait until cooldown expires.");
        }

        Map<String, Object> balance = accountServiceClient.getBalance(senderAccountNumber);
        Object accountStatus = balance.get("status");
        if (accountStatus != null && "BLOCKED".equalsIgnoreCase(String.valueOf(accountStatus))) {
            accountServiceClient.updateStatus(senderAccountNumber, AccountStatus.ACTIVE.name());
        }

        TransactionType transactionType = request.getType() == null ? TransactionType.TRANSFER : request.getType();
        String referenceNumber = (request.getReferenceNumber() != null && !request.getReferenceNumber().isBlank())
            ? request.getReferenceNumber()
            : "REF-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

        accountServiceClient.deductBalance(request.getSenderAccountNumber(), request.getAmount());

        Transaction transaction = Transaction.builder()
            .id(UUID.randomUUID().toString())
            .senderAccountNumber(request.getSenderAccountNumber())
            .receiverAccountNumber(request.getReceiverAccountNumber())
            .amount(request.getAmount())
            .type(transactionType)
            .status(TransactionStatus.PROCESSING)
            .referenceNumber(referenceNumber)
            .failureReason(null)
            .build();

        Transaction saved = transactionRepository.save(transaction);

        kafkaTemplate.send("transaction.initiated", Map.of(
            "transactionId", saved.getId(),
            "senderAccountNumber", saved.getSenderAccountNumber(),
            "receiverAccountNumber", saved.getReceiverAccountNumber(),
            "amount", saved.getAmount(),
            "type", saved.getType().name(),
            "referenceNumber", saved.getReferenceNumber()
        ));

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(String id) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        return mapToResponse(transaction);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionByReference(String referenceNumber) {
        Transaction transaction = transactionRepository.findByReferenceNumber(referenceNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with reference number: " + referenceNumber));
        return mapToResponse(transaction);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByAccount(String accountNumber) {
        return transactionRepository.findBySenderAccountNumberOrReceiverAccountNumberOrderByCreatedAtDesc(accountNumber, accountNumber)
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional
    public TransactionResponse verifyTransaction(String transactionId, String otp) {
        Transaction transaction = findTransaction(transactionId);
        String otpKey = "verification:otp:" + transactionId;
        String storedOtp = redisTemplate.opsForValue().get(otpKey);

        if (storedOtp == null || !storedOtp.equals(otp)) {
            return handleInvalidOtpAttempt(transaction);
        }

        redisTemplate.delete("otp:attempts:" + transaction.getSenderAccountNumber());
        redisTemplate.delete(otpKey);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setCompletedAt(LocalDateTime.now());
        transaction.setFailureReason(null);
        Transaction saved = transactionRepository.save(transaction);

        kafkaTemplate.send("transaction.completed", Map.of(
            "transactionId", saved.getId(),
            "senderAccountNumber", saved.getSenderAccountNumber(),
            "receiverAccountNumber", saved.getReceiverAccountNumber(),
            "amount", saved.getAmount()
        ));

        return mapToResponse(saved);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expirePendingVerificationTransactions() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(5);
        List<Transaction> expiredTransactions = transactionRepository.findByStatusAndCreatedAtBefore(
            TransactionStatus.PENDING_VERIFICATION,
            cutoff
        );

        for (Transaction tx : expiredTransactions) {
            tx.setStatus(TransactionStatus.EXPIRED);
            tx.setFailureReason("OTP expired");
            Transaction saved = transactionRepository.saveAndFlush(tx);
            redisTemplate.delete("verification:otp:" + saved.getId());
            redisTemplate.delete("otp:attempts:" + saved.getSenderAccountNumber());
            kafkaTemplate.send("transaction.refunded", Map.of(
                "transactionId", saved.getId(),
                "senderAccountNumber", saved.getSenderAccountNumber(),
                "amount", saved.getAmount(),
                "reason", "OTP expired"
            ));
        }
    }

    @Transactional
    public void processVerificationRequired(Map<String, Object> event) {
        String transactionId = (String) event.get("transactionId");
        if (transactionId == null) {
            return;
        }

        Transaction transaction = findTransaction(transactionId);
        if (transaction.getStatus() != TransactionStatus.PROCESSING) {
            return;
        }

        String otp = String.format("%06d", (int) (Math.random() * 900000) + 100000);
        String otpKey = "verification:otp:" + transactionId;
        redisTemplate.opsForValue().set(otpKey, otp, Duration.ofMinutes(5));

        transaction.setStatus(TransactionStatus.PENDING_VERIFICATION);
        transactionRepository.save(transaction);

        kafkaTemplate.send("transaction.otp.generated", Map.of(
            "transactionId", transaction.getId(),
            "senderAccountNumber", transaction.getSenderAccountNumber(),
            "amount", transaction.getAmount(),
            "reason", event.get("reason"),
            "otp", otp
        ));
    }

    @Transactional
    public void processFraudCheckClean(Map<String, Object> event) {
        String transactionId = (String) event.get("transactionId");
        if (transactionId == null) {
            return;
        }

        Transaction transaction = findTransaction(transactionId);
        if (transaction.getStatus() != TransactionStatus.PROCESSING) {
            return;
        }

        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setCompletedAt(LocalDateTime.now());
        transaction.setFailureReason(null);
        Transaction saved = transactionRepository.save(transaction);

        kafkaTemplate.send("transaction.completed", Map.of(
            "transactionId", saved.getId(),
            "senderAccountNumber", saved.getSenderAccountNumber(),
            "receiverAccountNumber", saved.getReceiverAccountNumber(),
            "amount", saved.getAmount()
        ));
    }

    private TransactionResponse refundExpiredTransaction(Transaction transaction) {
        redisTemplate.delete("verification:otp:" + transaction.getId());
        transaction.setStatus(TransactionStatus.EXPIRED);
        transaction.setFailureReason("OTP expired");
        Transaction saved = transactionRepository.saveAndFlush(transaction);
        kafkaTemplate.send("transaction.refunded", Map.of(
            "transactionId", saved.getId(),
            "senderAccountNumber", saved.getSenderAccountNumber(),
            "amount", saved.getAmount(),
            "reason", "OTP expired"
        ));
        return mapToResponse(saved);
    }

    private TransactionResponse refundWrongOtp(Transaction transaction) {
        redisTemplate.delete("verification:otp:" + transaction.getId());
        transaction.setStatus(TransactionStatus.FLAGGED);
        transaction.setFailureReason("Wrong OTP entered");
        Transaction saved = transactionRepository.save(transaction);
        kafkaTemplate.send("fraud.detected", Map.of(
            "accountNumber", saved.getSenderAccountNumber(),
            "transactionId", saved.getId(),
            "reason", "Wrong OTP entered"
        ));
        accountServiceClient.creditBalance(transaction.getSenderAccountNumber(), transaction.getAmount());
        kafkaTemplate.send("transaction.refunded", Map.of(
            "transactionId", saved.getId(),
            "senderAccountNumber", saved.getSenderAccountNumber(),
            "amount", saved.getAmount(),
            "reason", "Wrong OTP entered"
        ));
        return mapToResponse(saved);
    }

    private TransactionResponse handleInvalidOtpAttempt(Transaction transaction) {
        String accountNumber = transaction.getSenderAccountNumber();

        try {
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setFailureReason("Wrong OTP entered");
            transactionRepository.saveAndFlush(transaction);

            redisTemplate.delete("verification:otp:" + transaction.getId());
            redisTemplate.delete("otp:attempts:" + accountNumber);

            String lockoutKey = "lockout:account:" + accountNumber;
            redisTemplate.opsForValue().set(lockoutKey, "LOCKED", Duration.ofHours(5));

            try {
                accountServiceClient.updateStatus(accountNumber, AccountStatus.BLOCKED.name());
            } catch (Exception ex) {
                log.warn("Failed to lock account {} in account-service after invalid OTP; continuing controlled lockout response.", accountNumber, ex);
            }

            kafkaTemplate.send("transaction.refunded", Map.of(
                "transactionId", transaction.getId(),
                "senderAccountNumber", transaction.getSenderAccountNumber(),
                "amount", transaction.getAmount(),
                "reason", "Wrong OTP entered"
            ));

            kafkaTemplate.send("security.alert", Map.of(
                "accountNumber", accountNumber,
                "transactionId", transaction.getId(),
                "eventType", "OTP_LOCKOUT",
                "reason", "Wrong OTP entered",
                "lockedForHours", 5
            ));

            throw new AccountLockedException("Invalid OTP. Account has been blocked for 5 hours.");
        } catch (AccountLockedException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while handling invalid OTP lockout for transaction {}", transaction.getId(), ex);
            throw new AccountLockedException("Invalid OTP. Account has been blocked for 5 hours.");
        }
    }

    private Transaction findTransaction(String transactionId) {
        return transactionRepository.findById(transactionId)
            .orElseThrow(() -> new TransactionNotFoundException("Transaction not found: " + transactionId));
    }

    private TransactionResponse mapToResponse(Transaction transaction) {
        return TransactionResponse.builder()
            .id(transaction.getId())
            .senderAccountNumber(transaction.getSenderAccountNumber())
            .receiverAccountNumber(transaction.getReceiverAccountNumber())
            .amount(transaction.getAmount())
            .type(transaction.getType())
            .status(transaction.getStatus())
            .referenceNumber(transaction.getReferenceNumber())
            .failureReason(transaction.getFailureReason())
            .createdAt(transaction.getCreatedAt())
            .completedAt(transaction.getCompletedAt())
            .build();
    }
}
