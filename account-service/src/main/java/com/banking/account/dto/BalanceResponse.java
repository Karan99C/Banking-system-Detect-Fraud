package com.banking.account.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceResponse {

    private String accountNumber;
    private BigDecimal balance;
    private BigDecimal dailyTransactionLimit;
    private String status;
}
