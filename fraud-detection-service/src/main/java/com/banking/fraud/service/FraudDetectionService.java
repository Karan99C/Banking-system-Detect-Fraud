package com.banking.fraud.service;

import com.banking.fraud.client.AccountServiceClient;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FraudDetectionService {

    private final StringRedisTemplate redisTemplate;
    private final AccountServiceClient accountServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void checkTransaction(Map<String, Object> event) {
        if (event == null) {
            return;
        }

        String transactionId = String.valueOf(event.get("transactionId"));
        String senderAccountNumber = String.valueOf(event.get("senderAccountNumber"));
        String amountValue = String.valueOf(event.get("amount"));

        BigDecimal amount = new BigDecimal(amountValue);
        String reason = null;

        reason = checkVelocity(senderAccountNumber);
        if (reason == null) {
            reason = checkSuspiciousSpike(senderAccountNumber, amount);
        }
        if (reason == null) {
            reason = checkHighBalancePercentage(senderAccountNumber, amount);
        }

        if (reason != null) {
            kafkaTemplate.send("verification.required", Map.of(
                "transactionId", transactionId,
                "senderAccountNumber", senderAccountNumber,
                "amount", amount,
                "reason", reason
            ));
            return;
        }

        kafkaTemplate.send("fraud.check.clean", Map.of(
            "transactionId", transactionId,
            "isFraud", false,
            "reason", null
        ));
    }

    private String checkVelocity(String accountNumber) {
        String key = "fraud:velocity:" + accountNumber;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, Duration.ofSeconds(60));
        }
        if (count != null && count > 5L) {
            return "Too many transactions in 60 seconds (velocity limit exceeded)";
        }
        return null;
    }

    private String checkSuspiciousSpike(String accountNumber, BigDecimal amount) {
        String key = "fraud:average-amount:" + accountNumber;
        String storedAverage = redisTemplate.opsForValue().get(key);

        if (storedAverage == null) {
            redisTemplate.opsForValue().set(key, amount.toPlainString());
            return null;
        }

        BigDecimal average = new BigDecimal(storedAverage);
        BigDecimal threshold = average.multiply(BigDecimal.valueOf(5));
        BigDecimal newAverage = average.add(amount).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        redisTemplate.opsForValue().set(key, newAverage.toPlainString());

        if (amount.compareTo(threshold) > 0) {
            return "Unusual transaction amount exceeds 5x average";
        }
        return null;
    }

    private String checkHighBalancePercentage(String senderAccountNumber, BigDecimal amount) {
        Map<String, Object> response = accountServiceClient.getBalance(senderAccountNumber);
        if (response == null || response.get("balance") == null) {
            return null;
        }

        BigDecimal balance = new BigDecimal(response.get("balance").toString());
        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        BigDecimal ninetyPercentThreshold = balance.multiply(new BigDecimal("0.90"));
        if (amount.compareTo(ninetyPercentThreshold) >= 0) {
            return "Transaction exceeds 90% of account balance";
        }
        return null;
    }
}
