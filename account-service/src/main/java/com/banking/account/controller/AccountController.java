package com.banking.account.controller;

import com.banking.account.dto.AccountResponse;
import com.banking.account.dto.BalanceResponse;
import com.banking.account.dto.CreateAccountRequest;
import com.banking.account.service.AccountService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.banking.account.enumtype.AccountStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accountService.createAccount(request));
    }

    @GetMapping("/{accountNumber}")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getAccount(accountNumber));
    }

    @GetMapping("/{accountNumber}/balance")
    public ResponseEntity<BalanceResponse> getBalance(@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getBalance(accountNumber));
    }

    @PutMapping("/{accountNumber}/activate")
    public ResponseEntity<AccountResponse> activateAccount(@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.activateAccount(accountNumber));
    }

    @PutMapping("/{accountNumber}/block")
    public ResponseEntity<AccountResponse> blockAccount(@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.blockAccount(accountNumber));
    }

    @PatchMapping("/{accountNumber}/status")
    @PutMapping("/{accountNumber}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable String accountNumber,
                                           @RequestParam AccountStatus status) {
        accountService.updateStatus(accountNumber, status);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{accountNumber}/deduct")
    public ResponseEntity<AccountResponse> deductBalance(@PathVariable String accountNumber,
                                                       @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(accountService.deductBalance(accountNumber, amount));
    }

    @PutMapping("/{accountNumber}/credit")
    public ResponseEntity<AccountResponse> creditBalance(@PathVariable String accountNumber,
                                                      @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(accountService.creditBalance(accountNumber, amount));
    }
}
