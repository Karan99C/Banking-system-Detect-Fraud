# Digital Banking & Real-Time Fraud Detection System

A distributed, event-driven banking platform built with Java 21, Spring Boot 3.3.x, Kafka, Redis, MySQL, and optional local AI assistance via Spring AI + Ollama. The system models a realistic digital banking workflow where money movement, fraud detection, OTP verification, account lockouts, and customer support all happen across independent services.

## Overview

This project demonstrates a production-like microservice architecture for:

- Real-time fraud checks on transfers and money movement
- Distributed balance consistency across services
- Step-up verification with OTP and account lockout enforcement
- Async event-driven orchestration using Kafka
- Resilient compensation handling through a SAGA-style refund flow
- AI-powered customer assistance for banking questions, policy explanations, and account review

The application is designed to show how a banking platform can keep security, reliability, and operational visibility while distributing responsibilities across separate services.

---

## System goals and problem statements

The platform solves a few core banking challenges:

1. Real-time fraud prevention
   - Rapid transaction spikes trigger fraud investigation
   - Unusual or repeated transactions can be blocked or escalated automatically

2. Distributed consistency without central database locking
   - Account state, balances, and transaction records are separated across services
   - Kafka and transaction state transitions help keep the flow consistent and auditable

3. Secure transaction confirmation
   - OTP generation and verification are required for sensitive transfers
   - Repeated wrong OTP attempts trigger a lockout policy to stop abuse

4. Recovery from partial failure
   - If a transfer fails after initial debit-like steps, the system triggers a compensating refund flow to restore consistency

5. Customer support and self-service assistance
   - A local LLM-backed assistant can answer account, transfer, and policy questions in plain English

---

## Architecture at a glance

### Service breakdown

| Service | Responsibility | Primary patterns | Port |
| --- | --- | --- | --- |
| `api-gateway` | Unified entry point; routes requests to internal services | Spring Cloud Gateway / OpenFeign integration | `8080` |
| `account-service` | Account creation, lookup, balance queries, status transitions, lock state | JPA + MySQL, Redis lock metadata, status checks | `8081` |
| `transaction-service` | Initiates transfers, stores transaction state, generates OTPs, verifies OTP, handles refunds | State machine, Kafka producer/consumer, Redis OTP tracking | `8082` |
| `payment-service` | Payment settlement / downstream fulfillment processes | Event-driven payment flow | `8083` |
| `fraud-detection-service` | Checks transaction velocity / suspicious patterns | Redis counters, Kafka event consumer | `8084` |
| `notification-service` | Sends OTP alerts, fraud notices, refund and status updates | Kafka-driven notifications | `8085` |
| `ai-assistant-service` / AI module | Customer-facing banking assistant using LLM + tool calling | Spring AI, Ollama, RAG/context retrieval | Optional |

### High-level communication model

```text
                     ┌──────────────────────┐
                     │      Client App      │
                     │  Web / Mobile / API  │
                     └──────────┬───────────┘
                                │ HTTP
                                ▼
                     ┌──────────────────────┐
                     │    api-gateway       │
                     │  Route + auth + fanout │
                     └───────┬──────────────┘
                             │
         ┌───────────────────┼──────────────────────┐
         │                   │                      │
         │                   ▼                      ▼
         │      ┌─────────────────────┐   ┌─────────────────────┐
         │      │  account-service    │   │ transaction-service │
         │      │  Account + balance   │   │ Transfer + OTP +    │
         │      │  + lock state        │   │ state management    │
         │      └──────────┬──────────┘   └──────────┬──────────┘
         │                 │                         │
         │                 │ OpenFeign / REST        │ Kafka events
         │                 │                         │
         │                 ▼                         ▼
         │        ┌─────────────────────┐   ┌─────────────────────┐
         │        │ fraud-detection     │   │ notification-service│
         │        │ service              │   │ OTP + alerts +      │
         │        │ risk scoring        │   │ refunds             │
         │        └─────────────────────┘   └─────────────────────┘
         │
         └───────────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
                             ┌─────────────────────┐
                             │ payment-service     │
                             │ settlement / result │
                             └─────────────────────┘

                           Kafka (async events)
                              transaction.initiated
                              fraud.check.clean
                              fraud.detected
                              transaction.otp.generated
                              transaction.completed
                              transaction.refunded
                              payment.completed
                              payment.failed

                           Redis (shared state)
                              otp:attempts:account
                              lockout:account:{accountNumber}
                              fraud:velocity:{accountNumber}
                              verification:otp:{transactionId}
```

### Communication flow

- Synchronous communication: REST + OpenFeign between services
- Asynchronous communication: Kafka topics for events and notifications
- Shared temporary state: Redis for OTP attempts, rate limiting, fraud counters, and lockouts
- Persistent state: MySQL for account records, transactions, and payment data

---

## Core resiliency and security patterns

### 1. SAGA orchestration pattern

This application implements a banking-style SAGA workflow for money movement and failed transfers.

#### Transfer lifecycle

1. Client sends a transfer request to `transaction-service`
2. `transaction-service` validates the sender account and checks lockout state
3. A pending transaction is created with an `OTP_REQUIRED` or `PENDING_VERIFICATION` state
4. A 6-digit OTP is generated and stored in Redis with a TTL
5. Kafka emits a `transaction.otp.generated` event for notification delivery
6. Fraud service evaluates unusual behavior and emits either:
   - `fraud.check.clean` → proceed to final verification, or
   - `fraud.detected` → suspend or reject the flow
7. User verifies the OTP through `POST /api/v1/transactions/{id}/verify`
8. On success:
   - transaction status advances to `COMPLETED`
   - payment event is emitted
   - funds are settled downstream
9. On failure, expiry, or wrong OTP:
   - transaction is marked failed
   - compensating refund logic is triggered
   - refund events are emitted and deduplicated to avoid double crediting

This pattern makes the system fault-tolerant without requiring a single distributed transaction across all services.

### 2. Distributed rate limiting and cooldown (Redis)

Redis is used intensively for short-lived behavioral state:

- `fraud:velocity:{accountNumber}` for rapid transaction counts
- `otp:attempts:{accountNumber}` for failed OTP attempts
- `lockout:account:{accountNumber}` for cooldown/temporary blocking
- `verification:otp:{transactionId}` for OTP values and expiration

#### Business rule

- If a user triggers a high volume of rapid transfers, step-up verification is required
- After repeated invalid OTP entries, the account is blocked for a fixed period
- The lockout logic is enforced as a security control to reduce brute-force or social-engineering abuse

Example rule set:

- 3 rapid transfers in a short window → step-up verification challenge
- Wrong OTP attempts accumulate against the sender account
- 3 failed OTP entries → account enters `LOCKED` / cooldown state for 5 hours
- During lockdown, transfers and OTP validation are denied until manual reset or expiry

### 3. Database idempotency and refund deduplication

Duplicate events can happen in asynchronous systems. To keep accounting safe:

- Refunds and compensation events are checked against prior processed transaction IDs
- Duplicate refund messages are ignored if already applied once
- Transaction state transitions are protected against reprocessing
- A refund compensation event should be idempotent: credit once, never twice

This protects the ledger from double-crediting during retry storms, duplicate Kafka delivery, or replayed events.

---

## Spring AI and local LLM integration

The project includes a banking assistant pattern built around Spring AI and a local Ollama model. This is an optional but high-value extension for customer support and self-service financial guidance.

### Local LLM runtime

The system is designed to run a local Ollama instance alongside the Java services, typically with a containerized service such as:

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: banking-ollama
  ports:
    - "11434:11434"
  volumes:
    - ollama-data:/root/.ollama
```

Model used in this pattern:

- `llama3.2`

### Why this matters

The assistant can answer customer questions like:

- Why was my transfer rejected?
- Is my money safe after a failed verification?
- What are the limits or lockout policies?
- What happened to my refund request?

### Tool / function calling pattern

The assistant is grounded in real system tools so it does not hallucinate account details. Typical tool functions:

- `getAccountSummary(accountNumber)`
- `getRecentTransactions(accountNumber, limit)`
- `getLockoutDetails(accountNumber)`

These tools let the LLM explain transaction outcomes in plain English while staying bound to real data from the banking platform.

### RAG and policy context

The assistant can also use a retrieval layer that contains:

- transfer rules and limits
- OTP security policy
- fraud detection policy
- refund and compensation guidance
- customer support playbooks

This creates a customer-safe summary such as:

> “Your transfer was blocked because the transaction exceeded a velocity threshold and required step-up verification. Your funds were not transferred, and your account remains protected.”

---

## Infrastructure and prerequisites

### Required tools

- Java 21 or later
- Maven 3.9+
- Docker and Docker Compose
- MySQL client for verification
- Optional: Postman, Insomnia, Thunder Client, or curl

### Project structure

```text
banking-system/
├── api-gateway/
├── account-service/
├── transaction-service/
├── fraud-detection-service/
├── payment-service/
├── notification-service/
├── mysql-init/
├── docker-compose.yml
├── pom.xml
├── README.md
└── ARCHITECTURE.md
```

### Start infrastructure services

From the root directory:

```bash
docker compose up -d
```

This launches the base platform dependencies:

- MySQL on `localhost:3306`
- Redis on `localhost:6379`
- Kafka on `localhost:9092`
- Zookeeper on `localhost:2181`

### Pull and verify Ollama model

If you are running the optional AI support:

```bash
docker exec -it banking-ollama ollama pull llama3.2
```

Then verify it is available:

```bash
docker exec -it banking-ollama ollama list
```

### Build the project

From the root directory:

```bash
mvn clean install
```

### Run services in order

```bash
mvn spring-boot:run -pl account-service
mvn spring-boot:run -pl transaction-service
mvn spring-boot:run -pl payment-service
mvn spring-boot:run -pl fraud-detection-service
mvn spring-boot:run -pl notification-service
mvn spring-boot:run -pl api-gateway
```

Typical service ports:

1. `account-service` → `8081`
2. `transaction-service` → `8082`
3. `payment-service` → `8083`
4. `fraud-detection-service` → `8084`
5. `notification-service` → `8085`
6. `api-gateway` → `8080`

---

## End-to-end API testing guide

### 1. Create accounts

#### Sender account

```bash
curl -X POST http://localhost:8081/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountHolderName": "Alice Johnson",
    "email": "alice@example.com",
    "phone": "+1234567890",
    "accountType": "SAVINGS",
    "initialDeposit": 10000
  }'
```

#### Receiver account

```bash
curl -X POST http://localhost:8081/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountHolderName": "Bob Smith",
    "email": "bob@example.com",
    "phone": "+1987654321",
    "accountType": "CURRENT",
    "initialDeposit": 6000
  }'
```

#### Check account balance / details

```bash
curl http://localhost:8081/api/v1/accounts/{accountId}
```

### 2. Initiate a transfer

```bash
curl -X POST http://localhost:8082/api/v1/transactions/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "senderAccountNumber": "<sender-account-number>",
    "receiverAccountNumber": "<receiver-account-number>",
    "amount": 600,
    "type": "TRANSFER",
    "referenceNumber": "REF-20240601-001"
  }'
```

Expected outcome:

- A transaction record is created
- An OTP is generated and stored in Redis
- Kafka emits `transaction.otp.generated`
- Notification service notifies the sender

### 3. Verify OTP

#### Valid verification

```bash
curl -X POST "http://localhost:8082/api/v1/transactions/{transactionId}/verify?otp={otp}"
```

#### Wrong OTP test

```bash
curl -X POST "http://localhost:8082/api/v1/transactions/{transactionId}/verify?otp=000000"
```

This should trigger the lockout logic after the configured failed-attempt threshold.

#### Expired OTP test

```bash
curl -X POST "http://localhost:8082/api/v1/transactions/{transactionId}/verify?otp={expiredOtp}"
```

### 4. Fraud check / velocity test

Trigger a rapid sequence of transfers to validate suspicious behavior:

```bash
for i in $(seq 1 6); do
  curl -s -X POST http://localhost:8082/api/v1/transactions/transfer \
    -H "Content-Type: application/json" \
    -d '{
      "senderAccountNumber": "<sender-account-number>",
      "receiverAccountNumber": "<receiver-account-number>",
      "amount": 10,
      "type": "TRANSFER",
      "referenceNumber": "REF-VELOCITY-'"$i"'"
    }' >/dev/null;
done
```

This simulates bursty transfer traffic and should trigger the fraud-detection logic.

### 5. AI chat endpoint

If the assistant module is running, the chat endpoint can look like this:

```bash
curl -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why was my transfer rejected and is my money safe?",
    "accountNumber": "<account-number>",
    "context": "customer-support"
  }'
```

Example response:

```json
{
  "reply": "Your transfer was rejected because the transaction exceeded a risk threshold and required additional verification. The money was not moved or debited. Your account remains protected, and the system has logged the activity for review.",
  "riskSummary": "Velocity and OTP verification checks triggered.",
  "accountStatus": "ACTIVE",
  "lockoutStatus": "NONE"
}
```

### Thunder Client / Postman examples

Use the `api-gateway` route for end-to-end testing when you want a single ingress point for all services:

- `POST http://localhost:8080/api/v1/accounts`
- `GET http://localhost:8080/api/v1/accounts/{id}`
- `POST http://localhost:8080/api/v1/transactions/transfer`
- `POST http://localhost:8080/api/v1/transactions/{id}/verify?otp=123456`
- `POST http://localhost:8080/api/v1/ai/chat`

---

## Kafka topics used by the platform

- `transaction.initiated`
- `verification.required`
- `transaction.otp.generated`
- `fraud.check.clean`
- `fraud.detected`
- `transaction.completed`
- `transaction.refunded`
- `payment.completed`
- `payment.failed`

## Database overview

- MySQL databases:
  - `account_db`
  - `transaction_db`
  - `payment_db`
- Redis: OTP, attempts, lockout, velocity counters, fraud data
- Kafka: event sourcing / inter-service coordination

---

## Operational notes

- The system is built to be resilient under partial failure and asynchronous delays.
- Account lockout and OTP verification are enforced as security boundaries, not just UI hints.
- Refund and credit events use idempotent checks to prevent repeated balance crediting.
- The application is best evaluated with infrastructure running in Docker before starting the microservices.

---

## Project status

This repository presents a modern Java microservices banking platform for learning, architecture demonstration, and platform prototyping. It is especially useful for showcasing:

- event-driven architecture
- distributed security controls
- Java 21 + Spring Boot 3.3 pattern design
- microservice interaction via REST and Kafka
- local AI-assisted banking support with Ollama

---

## License

This project is intended for educational and demonstration purposes. Add your preferred license before production deployment or open-source distribution.
