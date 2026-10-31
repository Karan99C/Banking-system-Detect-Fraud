package com.banking.transaction.client;

import java.util.List;
import java.util.Map;

public interface TransactionServiceClient {

    List<Map<String, Object>> getRecentTransactions(String accountNumber);
}
