package com.banking.account.repository;

import com.banking.account.entity.RefundProcessedTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RefundProcessedTransactionRepository extends JpaRepository<RefundProcessedTransaction, String> {

    boolean existsByTransactionId(String transactionId);
}
