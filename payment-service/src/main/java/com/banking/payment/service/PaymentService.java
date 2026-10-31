package com.banking.payment.service;

import com.banking.payment.dto.CreateOrderRequest;
import com.banking.payment.dto.PaymentOrderResponse;
import com.banking.payment.entity.Payment;
import com.banking.payment.enumtype.PaymentStatus;
import com.banking.payment.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RazorpayClient razorpayClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public PaymentOrderResponse createOrder(CreateOrderRequest request) {
        try {
            JSONObject orderRequest = new JSONObject();
            long amountInPaise = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", request.getCurrency());
            orderRequest.put("receipt", "pay-" + UUID.randomUUID());

            Order order = razorpayClient.orders.create(orderRequest);
            Payment payment = Payment.builder()
                .id(UUID.randomUUID().toString())
                .razorpayOrderId(order.get("id"))
                .accountNumber(request.getAccountNumber())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(PaymentStatus.CREATED)
                .build();

            paymentRepository.save(payment);

            return PaymentOrderResponse.builder()
                .id(payment.getId())
                .orderId(payment.getRazorpayOrderId())
                .accountNumber(payment.getAccountNumber())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().name())
                .build();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create Razorpay order: " + ex.getMessage(), ex);
        }
    }

    @Transactional
    public void handleWebhook(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return;
        }

        String event = (String) payload.get("event");
        if (event == null) {
            return;
        }

        Map<String, Object> paymentPayload = (Map<String, Object>) payload.get("payload");
        if (paymentPayload == null) {
            return;
        }

        Map<String, Object> paymentMap = (Map<String, Object>) paymentPayload.get("payment");
        if (paymentMap == null) {
            return;
        }

        Map<String, Object> entity = (Map<String, Object>) paymentMap.get("entity");
        if (entity == null) {
            return;
        }

        String paymentId = (String) entity.get("id");
        String orderId = (String) entity.get("order_id");
        String amountValue = entity.get("amount") == null ? null : entity.get("amount").toString();
        BigDecimal amount = amountValue == null ? BigDecimal.ZERO : new BigDecimal(amountValue).movePointLeft(2);

        Optional<Payment> paymentOptional = paymentRepository.findByRazorpayOrderId(orderId);
        Payment payment = paymentOptional.orElseGet(() -> Payment.builder()
            .id(UUID.randomUUID().toString())
            .razorpayOrderId(orderId)
            .accountNumber("unknown")
            .amount(amount)
            .currency("INR")
            .status(PaymentStatus.CREATED)
            .build());

        if ("payment.captured".equals(event)) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setRazorpayPaymentId(paymentId);
            paymentRepository.save(payment);

            kafkaTemplate.send("payment.completed", Map.of(
                "paymentId", paymentId,
                "accountNumber", payment.getAccountNumber(),
                "amount", payment.getAmount(),
                "currency", payment.getCurrency(),
                "status", payment.getStatus().name()
            ));
            return;
        }

        if ("payment.failed".equals(event)) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setRazorpayPaymentId(paymentId);
            paymentRepository.save(payment);

            kafkaTemplate.send("payment.failed", Map.of(
                "paymentId", paymentId,
                "accountNumber", payment.getAccountNumber(),
                "amount", payment.getAmount(),
                "currency", payment.getCurrency(),
                "status", payment.getStatus().name(),
                "failureReason", "Payment failed"
            ));
        }
    }
}
