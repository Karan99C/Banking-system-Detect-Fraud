package com.banking.transaction.repository;

import com.banking.transaction.entity.Transaction;
import com.banking.transaction.enumtype.TransactionStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    Optional<Transaction> findByReferenceNumber(String referenceNumber);

    List<Transaction> findBySenderAccountNumberOrReceiverAccountNumberOrderByCreatedAtDesc(String senderAccountNumber, String receiverAccountNumber);

    List<Transaction> findByStatusAndCreatedAtBefore(TransactionStatus status, LocalDateTime cutoff);
}
