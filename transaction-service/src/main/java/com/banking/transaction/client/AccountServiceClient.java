package com.banking.transaction.client;

import java.math.BigDecimal;
import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "account-service", url = "http://localhost:8081")
public interface AccountServiceClient {

    @PutMapping("/api/v1/accounts/{accountNumber}/deduct")
    Map<String, Object> deductBalance(@PathVariable String accountNumber, @RequestParam BigDecimal amount);

    @PutMapping("/api/v1/accounts/{accountNumber}/credit")
    Map<String, Object> creditBalance(@PathVariable String accountNumber, @RequestParam BigDecimal amount);

    @PutMapping("/api/v1/accounts/{accountNumber}/block")
    Map<String, Object> blockAccount(@PathVariable String accountNumber);

    @PatchMapping("/api/v1/accounts/{accountNumber}/status")
    ResponseEntity<Void> updateStatus(@PathVariable("accountNumber") String accountNumber,
                                    @RequestParam("status") String status);

    @GetMapping("/api/v1/accounts/{accountNumber}/balance")
    Map<String, Object> getBalance(@PathVariable String accountNumber);
}
