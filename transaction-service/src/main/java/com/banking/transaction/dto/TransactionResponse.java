package com.banking.transaction.dto;

import com.banking.transaction.enumtype.TransactionStatus;
import com.banking.transaction.enumtype.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private String id;
    private String senderAccountNumber;
    private String receiverAccountNumber;
    private BigDecimal amount;
    private TransactionType type;
    private TransactionStatus status;
    private String referenceNumber;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
