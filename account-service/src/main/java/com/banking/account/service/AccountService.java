package com.banking.account.service;

import com.banking.account.dto.AccountResponse;
import com.banking.account.dto.BalanceResponse;
import com.banking.account.dto.CreateAccountRequest;
import com.banking.account.entity.Account;
import com.banking.account.enumtype.AccountStatus;
import com.banking.account.enumtype.AccountType;
import com.banking.account.exception.AccountNotFoundException;
import com.banking.account.exception.DuplicateAccountException;
import com.banking.account.exception.InvalidAccountOperationException;
import com.banking.account.repository.AccountRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        String normalizedEmail = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (accountRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateAccountException("An account already exists for email: " + normalizedEmail);
        }

        BigDecimal initialDeposit = request.getInitialDeposit() == null ? BigDecimal.ZERO : request.getInitialDeposit();
        BigDecimal dailyTransactionLimit = resolveDailyLimit(request.getAccountType());
        String accountNumber = generateUniqueAccountNumber();

        Account account = Account.builder()
            .id(UUID.randomUUID().toString())
            .accountNumber(accountNumber)
            .accountHolderName(request.getAccountHolderName().trim())
            .email(normalizedEmail)
            .phone(request.getPhone().trim())
            .accountType(request.getAccountType())
            .status(AccountStatus.ACTIVE)
            .balance(initialDeposit)
            .dailyTransactionLimit(dailyTransactionLimit)
            .build();

        Account saved = accountRepository.save(account);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(String accountNumber) {
        Account account = findAccountByNumber(accountNumber);
        return mapToResponse(account);
    }

    @Transactional(readOnly = true)
    public BalanceResponse getBalance(String accountNumber) {
        Account account = findAccountByNumber(accountNumber);
        return BalanceResponse.builder()
            .accountNumber(account.getAccountNumber())
            .balance(account.getBalance())
            .dailyTransactionLimit(account.getDailyTransactionLimit())
            .status(account.getStatus().name())
            .build();
    }

    @Transactional
    public AccountResponse deductBalance(String accountNumber, BigDecimal amount) {
        Account account = findAccountByNumber(accountNumber);
        validatePositiveAmount(amount);
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidAccountOperationException("Account is not active and cannot process deduction");
        }
        if (account.getBalance().compareTo(amount) < 0) {
            throw new InvalidAccountOperationException("Insufficient balance for deduction");
        }

        account.setBalance(account.getBalance().subtract(amount));
        return mapToResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse creditBalance(String accountNumber, BigDecimal amount) {
        Account account = findAccountByNumber(accountNumber);
        validatePositiveAmount(amount);
        if (account.getStatus() == AccountStatus.CLOSED || account.getStatus() == AccountStatus.TERMINATED) {
            throw new InvalidAccountOperationException("Closed or terminated account cannot receive credit");
        }

        account.setBalance(account.getBalance().add(amount));
        return mapToResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse activateAccount(String accountNumber) {
        Account account = findAccountByNumber(accountNumber);
        account.setStatus(AccountStatus.ACTIVE);
        return mapToResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse blockAccount(String accountNumber) {
        Account account = findAccountByNumber(accountNumber);
        account.setStatus(AccountStatus.BLOCKED);
        return mapToResponse(accountRepository.save(account));
    }

    @Transactional
    public void updateStatus(String accountNumber, AccountStatus status) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new AccountNotFoundException("Account not found with account number: " + accountNumber));

        account.setStatus(status);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);
    }

    private Account findAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new AccountNotFoundException("Account not found with number: " + accountNumber));
    }

    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidAccountOperationException("Amount must be greater than zero");
        }
    }

    private BigDecimal resolveDailyLimit(AccountType accountType) {
        if (accountType == null) {
            return BigDecimal.valueOf(500000);
        }
        if (accountType == AccountType.SAVINGS) {
            return BigDecimal.valueOf(100000);
        }
        return BigDecimal.valueOf(500000);
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            int generated = RANDOM.nextInt(900000000) + 100000000;
            accountNumber = String.format("%012d", generated);
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }

    private AccountResponse mapToResponse(Account account) {
        return AccountResponse.builder()
            .id(account.getId())
            .accountNumber(account.getAccountNumber())
            .accountHolderName(account.getAccountHolderName())
            .email(account.getEmail())
            .phone(account.getPhone())
            .accountType(account.getAccountType())
            .status(account.getStatus())
            .balance(account.getBalance())
            .dailyTransactionLimit(account.getDailyTransactionLimit())
            .createdAt(account.getCreatedAt())
            .updatedAt(account.getUpdatedAt())
            .build();
    }
}
