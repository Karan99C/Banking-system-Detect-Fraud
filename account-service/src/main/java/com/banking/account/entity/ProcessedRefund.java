package com.banking.account.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "processed_refunds")
public class ProcessedRefund {

    @Id
    private String transactionId;

    private LocalDateTime refundedAt;

    public ProcessedRefund() {
    }

    public ProcessedRefund(String transactionId, LocalDateTime refundedAt) {
        this.transactionId = transactionId;
        this.refundedAt = refundedAt;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public LocalDateTime getRefundedAt() {
        return refundedAt;
    }

    public void setRefundedAt(LocalDateTime refundedAt) {
        this.refundedAt = refundedAt;
    }
}
