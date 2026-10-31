package com.banking.fraud.kafka;

import com.banking.fraud.service.FraudDetectionService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FraudDetectionEventConsumer {

    private final FraudDetectionService fraudDetectionService;

    @KafkaListener(topics = "transaction.initiated", groupId = "fraud-service-group")
    public void consumeTransactionInitiated(@Payload Map<String, Object> event) {
        fraudDetectionService.checkTransaction(event);
    }
}
