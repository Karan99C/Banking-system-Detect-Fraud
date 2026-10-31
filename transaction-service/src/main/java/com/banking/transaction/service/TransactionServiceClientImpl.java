package com.banking.transaction.service;

import com.banking.transaction.client.TransactionServiceClient;
import com.banking.transaction.entity.Transaction;
import com.banking.transaction.repository.TransactionRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransactionServiceClientImpl implements TransactionServiceClient {

    private final TransactionRepository transactionRepository;

    @Override
    public List<Map<String, Object>> getRecentTransactions(String accountNumber) {
        return transactionRepository.findBySenderAccountNumberOrReceiverAccountNumberOrderByCreatedAtDesc(accountNumber, accountNumber)
            .stream()
            .limit(10)
            .map(this::toMap)
            .toList();
    }

    private Map<String, Object> toMap(Transaction transaction) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", transaction.getId());
        values.put("referenceNumber", transaction.getReferenceNumber());
        values.put("type", transaction.getType() == null ? null : transaction.getType().name());
        values.put("status", transaction.getStatus() == null ? null : transaction.getStatus().name());
        values.put("amount", transaction.getAmount());
        values.put("senderAccountNumber", transaction.getSenderAccountNumber());
        values.put("receiverAccountNumber", transaction.getReceiverAccountNumber());
        values.put("failureReason", transaction.getFailureReason());
        values.put("createdAt", transaction.getCreatedAt());
        values.put("completedAt", transaction.getCompletedAt());
        return values;
    }
}
