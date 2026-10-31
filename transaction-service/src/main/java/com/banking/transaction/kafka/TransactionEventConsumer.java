package com.banking.transaction.kafka;

import com.banking.transaction.service.TransactionService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TransactionEventConsumer {

    private final TransactionService transactionService;

    @KafkaListener(topics = "verification.required", groupId = "transaction-service-group")
    public void handleVerificationRequired(@Payload Map<String, Object> event) {
        transactionService.processVerificationRequired(event);
    }

    @KafkaListener(topics = "fraud.check.clean", groupId = "transaction-service-group")
    public void handleFraudCheckClean(@Payload Map<String, Object> event) {
        transactionService.processFraudCheckClean(event);
    }
}
