package com.banking.payment.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrderResponse {

    private String id;
    private String orderId;
    private String accountNumber;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String razorpayPaymentId;
}
