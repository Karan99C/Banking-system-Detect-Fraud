package com.banking.account.repository;

import com.banking.account.entity.ProcessedRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedRefundRepository extends JpaRepository<ProcessedRefund, String> {
}
