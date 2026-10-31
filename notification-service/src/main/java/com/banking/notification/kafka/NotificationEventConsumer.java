package com.banking.notification.kafka;

import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NotificationEventConsumer {

    @KafkaListener(topics = "transaction.otp.generated", groupId = "notification-service-group")
    public void handleOtpGenerated(@Payload Map<String, Object> event) {
        String transactionId = String.valueOf(event.get("transactionId"));
        String amount = String.valueOf(event.get("amount"));
        String reason = String.valueOf(event.get("reason"));
        String otp = String.valueOf(event.get("otp"));
        log.info("OTP Alert: transactionId={}, amount={}, reason={}, otp={}", transactionId, amount, reason, otp);
    }

    @KafkaListener(topics = "transaction.completed", groupId = "notification-service-group")
    public void handleTransactionCompleted(@Payload Map<String, Object> event) {
        String senderAccountNumber = String.valueOf(event.get("senderAccountNumber"));
        String receiverAccountNumber = String.valueOf(event.get("receiverAccountNumber"));
        String amount = String.valueOf(event.get("amount"));

        log.info("Transaction completed: senderAccountNumber={}, receiverAccountNumber={}, amount={}",
            senderAccountNumber, receiverAccountNumber, amount);
        log.info("Debit alert for sender {}: amount={}", senderAccountNumber, amount);
        log.info("Credit alert for receiver {}: amount={}", receiverAccountNumber, amount);
    }

    @KafkaListener(topics = "fraud.detected", groupId = "notification-service-group")
    public void handleFraudDetected(@Payload Map<String, Object> event) {
        String accountNumber = String.valueOf(event.get("accountNumber"));
        String reason = String.valueOf(event.get("reason"));
        log.info("Fraud detected: accountNumber={}, reason={}", accountNumber, reason);
        log.info("Account blocked alert for accountNumber={}", accountNumber);
    }

    @KafkaListener(topics = "transaction.refunded", groupId = "notification-service-group")
    public void handleRefunded(@Payload Map<String, Object> event) {
        String transactionId = String.valueOf(event.get("transactionId"));
        String senderAccountNumber = String.valueOf(event.get("senderAccountNumber"));
        String reason = String.valueOf(event.get("reason"));
        String amount = String.valueOf(event.get("amount"));
        log.info("Refund alert: transactionId={}, senderAccountNumber={}, amount={}, reason={}",
            transactionId, senderAccountNumber, amount, reason);
    }

    @KafkaListener(topics = "payment.completed", groupId = "notification-service-group")
    public void handlePaymentCompleted(@Payload Map<String, Object> event) {
        String paymentId = String.valueOf(event.get("paymentId"));
        String accountNumber = String.valueOf(event.get("accountNumber"));
        String amount = String.valueOf(event.get("amount"));
        log.info("Payment completed alert: paymentId={}, accountNumber={}, amount={}", paymentId, accountNumber, amount);
    }

    @KafkaListener(topics = "payment.failed", groupId = "notification-service-group")
    public void handlePaymentFailed(@Payload Map<String, Object> event) {
        String paymentId = String.valueOf(event.get("paymentId"));
        String accountNumber = String.valueOf(event.get("accountNumber"));
        String amount = String.valueOf(event.get("amount"));
        String failureReason = String.valueOf(event.get("failureReason"));
        log.info("Payment failed alert: paymentId={}, accountNumber={}, amount={}, reason={}",
            paymentId, accountNumber, amount, failureReason);
    }

    @KafkaListener(topics = "security.alert", groupId = "notification-service-group")
    public void handleSecurityAlert(@Payload Map<String, Object> event) {
        String accountNumber = String.valueOf(event.get("accountNumber"));
        String transactionId = String.valueOf(event.get("transactionId"));
        String reason = String.valueOf(event.get("reason"));
        String eventType = String.valueOf(event.get("eventType"));
        log.warn("Security alert: eventType={}, accountNumber={}, transactionId={}, reason={}",
            eventType, accountNumber, transactionId, reason);
    }
}
