package com.banking.account.kafka;

import com.banking.account.entity.Account;
import com.banking.account.entity.ProcessedRefund;
import com.banking.account.exception.AccountNotFoundException;
import com.banking.account.repository.AccountRepository;
import com.banking.account.repository.ProcessedRefundRepository;
import com.banking.account.service.AccountService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AccountEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(AccountEventConsumer.class);

    private final AccountService accountService;
    private final AccountRepository accountRepository;
    private final ProcessedRefundRepository processedRefundRepository;

    @KafkaListener(topics = "transaction.completed", groupId = "account-service-group")
    @Transactional
    public void handleTransactionCompleted(@Payload Map<String, Object> event) {
        String receiverAccountNumber = (String) event.get("receiverAccountNumber");
        Object amountObject = event.get("amount");
        BigDecimal amount = toBigDecimal(amountObject);

        if (receiverAccountNumber != null && amount != null) {
            accountService.creditBalance(receiverAccountNumber, amount);
        }
    }

    @KafkaListener(topics = {"transaction.refunded", "transaction-failed-topic", "refund-topic", "refund.failed"}, groupId = "account-service-group")
    @Transactional
    public void handleRefundEvent(@Payload Map<String, Object> event) {
        Object txIdObject = event.get("transactionId");
        String transactionId = txIdObject == null ? null : String.valueOf(txIdObject);
        String senderAccountNumber = event.get("senderAccountNumber") != null
            ? String.valueOf(event.get("senderAccountNumber"))
            : (String) event.get("accountNumber");
        BigDecimal amount = toBigDecimal(event.get("amount"));

        if (transactionId == null || senderAccountNumber == null || amount == null) {
            return;
        }

        if (processedRefundRepository.existsById(transactionId)) {
            log.warn("Duplicate refund event for tx {}. Skipping balance credit.", transactionId);
            return;
        }

        Account account = accountRepository.findByAccountNumber(senderAccountNumber)
            .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        account.setBalance(account.getBalance().add(amount));
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        processedRefundRepository.save(new ProcessedRefund(transactionId, LocalDateTime.now()));

        log.info("SAGA Refund applied: {} added back to account {}. New balance: {}",
            amount, account.getAccountNumber(), account.getBalance());
    }

    @KafkaListener(topics = "fraud.detected", groupId = "account-service-group")
    @Transactional
    public void handleFraudDetected(@Payload Map<String, Object> event) {
        String accountNumber = (String) event.get("accountNumber");
        if (accountNumber != null) {
            accountService.blockAccount(accountNumber);
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return new BigDecimal(number.toString());
        }
        return new BigDecimal(value.toString());
    }
}
