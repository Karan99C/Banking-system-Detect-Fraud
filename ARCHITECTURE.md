# Architecture Guide

## 1. Purpose and scope

This document explains how the banking platform is structured as a distributed microservice ecosystem. It focuses on the responsibilities of each service, the interaction patterns between them, and the security and reliability design principles behind the system.

The project is an event-driven digital banking platform that includes:

- account management and balance state
- transfer initiation and OTP enforcement
- fraud detection and velocity analysis
- compensation/refund logic for failures
- notification delivery through Kafka
- optional AI-driven customer support using Spring AI + Ollama

---

## 2. Architectural principles

The design follows a few key principles:

1. Service isolation
   - Each domain owns its own data and responsibilities
   - Account, transaction, payment, fraud, and notification concerns are decoupled

2. Event-driven coordination
   - Kafka is the messaging backbone between services
   - Long-running workflows are handled as asynchronous event chains

3. Secure-by-default operations
   - OTP and lockout logic are enforced in the transaction domain
   - Account status blocks high-risk activity and prevents further abuse

4. Resilient compensation
   - Failures are handled using compensating actions rather than relying on a single monolithic transaction

5. AI-assisted customer support
   - The assistant is grounded in real account and transaction data through tool-based function calling

---

## 3. System topology

```text
                                      ┌────────────────────────┐
                                      │       Client App        │
                                      │ Web / Mobile / API     │
                                      └───────────┬────────────┘
                                                  │ HTTPS
                                                  ▼
                                      ┌────────────────────────┐
                                      │     api-gateway        │
                                      │  Entry point / routing │
                                      └───────────┬────────────┘
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          │                       │                       │
                          ▼                       ▼                       ▼
              ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
              │  account-service     │  │ transaction-service   │  │ payment-service       │
              │ - account lifecycle  │  │ - transfer requests  │  │ - settlement logic   │
              │ - balances           │  │ - OTP generation      │  │ - downstream pay     │
              │ - status / lock      │  │ - verification        │  │ - payment events     │
              └───────────┬──────────┘  └───────────┬──────────┘  └───────────┬──────────┘
                          │                          │                          │
                          │                          │                          │
                          └──────────────────────────┼──────────────────────────┘
                                                     │
                                                     ▼
                                      ┌────────────────────────┐
                                      │  fraud-detection-service │
                                      │ - velocity / risk check │
                                      │ - suspicious txn logic  │
                                      └───────────┬────────────┘
                                                  │
                                                  ▼
                                      ┌────────────────────────┐
                                      │ notification-service   │
                                      │ - OTP alerts           │
                                      │ - fraud notifications  │
                                      │ - refund alerts        │
                                      └────────────────────────┘

                         Kafka Topics / Async Messaging
                         transaction.initiated
                         transaction.otp.generated
                         fraud.check.clean
                         fraud.detected
                         transaction.completed
                         transaction.refunded
                         payment.completed
                         payment.failed

                         Redis Shared State
                         lockout:account:{accountNumber}
                         otp:attempts:{accountNumber}
                         verification:otp:{transactionId}
                         fraud:velocity:{accountNumber}
```

---

## 4. Service responsibilities

### account-service

This service owns all customer account lifecycle concerns.

Responsibilities:

- Create/update accounts
- Query account by ID, number, or holder metadata
- Maintain account status (`ACTIVE`, `BLOCKED`, etc.)
- Validate balance sufficiency before transfer execution
- Apply lockout state changes triggered by OTP abuse or risk escalation
- Expose account metadata to the fraud and transaction services

Key integration points:

- REST endpoints for account management
- OpenFeign / synchronous calls to account details when needed by other services
- Event-driven lockout status updates triggered by Kafka or service logic

### transaction-service

This is the orchestration center for payment movement and security enforcement.

Responsibilities:

- Accept transfer requests from clients or the gateway
- Store transaction records in a transaction database
- Generate OTP secrets and store them with TTL in Redis
- Verify OTP and enforce invalid-attempt counting
- Track transaction states and handle expiry/failure transitions
- Trigger compensating refund flows when a transfer fails
- Publish transaction lifecycle events to Kafka

Important transaction states include:

- `PENDING_VERIFICATION`
- `OTP_REQUIRED`
- `PROCESSING`
- `COMPLETED`
- `FAILED`
- `REFUNDED`

### fraud-detection-service

This service evaluates suspicious transaction patterns.

Responsibilities:

- consume `transaction.initiated` events
- evaluate account velocity / repeated transfer burst patterns
- calculate risk using customer and transaction characteristics
- emit `fraud.check.clean` or `fraud.detected`
- assist downstream lockout or escalation logic

The service is intentionally lightweight and focused on risk scoring rather than business logic-heavy settlement.

### payment-service

This domain handles downstream settlement processes.

Responsibilities:

- process payment requests once the transaction is approved
- complete external confirmation or settlement signaling
- emit success/failure payment events to Kafka

### notification-service

This service is the alerting and communication handler.

Responsibilities:

- listen to `transaction.otp.generated`
- send OTP notifications or customer alerts
- listen for `fraud.detected`
- send fraud warnings
- listen for refund-related events and inform customers

This service is intentionally decoupled and event-driven so the business logic remains independent of delivery mechanics.

### ai-assistant-service / AI module

This optional service acts as a customer-facing assistant layer.

Responsibilities:

- speak to customers in plain English
- explain account status, fraud decisions, and transfer rejections
- retrieve current account and transaction context through tool calls
- give guidance using policy and procedural context from a local knowledge base

This layer typically connects to a local LLM server (Ollama) and uses Spring AI function/tool calling to securely access safe banking data.

---

## 5. Interaction patterns

### Synchronous communication

Synchronous requests are used for direct request/response relationships.

Typical examples:

- API Gateway → service lookup
- `transaction-service` → `account-service` for account validation and data lookup
- `fraud-detection-service` → `account-service` for account status / lock status checks

This is implemented with Spring REST and OpenFeign-style service clients.

### Asynchronous communication

Asynchronous flow is used for cross-service events and decoupled processing.

Example event chain:

1. `transaction.initiated`
2. `fraud.check.clean` or `fraud.detected`
3. `transaction.otp.generated`
4. `transaction.completed` or `transaction.refunded`
5. `payment.completed` / `payment.failed`

Kafka enables the platform to keep services independent while still coordinating secure transaction state.

---

## 6. Security model

### OTP verification flow

The transaction workflow includes a confirmation gate:

- transfer request is initiated
- OTP is created in Redis with expiration
- sender attempts verification
- wrong OTPs are counted and can trigger a cooldown
- repeated abuse triggers account freeze or strict lockout

This adds a second factor without requiring a heavy synchronous verification service.

### Account lockout logic

The lockout policy is enforced around a Redis key such as:

```text
lockout:account:{accountNumber}
```

A common pattern is:

- invalid OTP attempts accumulate
- after threshold is reached, account is temporarily blocked
- a 5-hour cooldown is applied
- further transaction and verification requests are rejected
- manual unblocking or TTL expiry restores access

### Event idempotency

The safe refund logic requires idempotent handling:

- each refund event must be processed only once
- duplicate messages should not re-credit an account
- state transitions should log and ignore repeated events

This is essential for systems that use Kafka retries, network issues, and replay scenarios.

---

## 7. SAGA flow in detail

The following sequence shows the transaction lifecycle as a SAGA-like workflow.

```text
Client
  │
  ▼
transaction-service
  │  1. validate sender account
  │  2. check lockout / fraud status
  │  3. create pending transaction
  │  4. generate OTP
  │  5. store OTP in Redis
  ▼
Kafka: transaction.otp.generated
  │
  ▼
notification-service
  │  send OTP notification
  ▼
Kafka: transaction.initiated
  │
  ▼
fraud-detection-service
  │  evaluate rapid-transfer patterns
  │  emit fraud.check.clean or fraud.detected
  ▼
transaction-service
  │  if fraud clean -> await OTP verification
  │  if fraud detected -> reject / suspend flow
  ▼
Client verifies OTP
  │
  ▼
transaction-service
  │  valid OTP -> complete transfer / emit success event
  │  invalid OTP -> increment failed attempts
  │  threshold reached -> account lockout + refund on transaction failure
  ▼
payment-service
  │  settlement / downstream payment processing
  ▼
Kafka: payment.completed / payment.failed
  │
  ▼
transaction-service
  │  if completed -> mark success
  │  if failed -> trigger refund / compensation
  ▼
Kafka: transaction.refunded
  │
  ▼
notification-service
  │  notify customer of refund or rejection outcome
```

---

## 8. Data model boundaries

The system separates concerns by domain instead of creating a single large schema.

### account-service domain

Account state includes:

- account ID
- holder name
- email / phone
- account type
- balance
- status
- created timestamp

### transaction-service domain

Transaction state includes:

- transaction ID
- sender / receiver account numbers
- amount
- type
- reference number
- status
- OTP metadata
- failure reasons

### payment-service domain

Payment processing records may include:

- payment ID
- transaction reference
- settlement status
- correlation metadata

### fraud domain

Fraud checks likely contain:

- account number
- transaction count
- velocity window
- risk outcome
- rule explanation

---

## 9. AI architecture

The AI assistant is meant to be grounded and safe.

### Pattern

1. User sends a message to the assistant endpoint
2. The AI service uses a local LLM runtime such as Ollama `llama3.2`
3. The model chooses a tool or function call based on the request
4. The tool fetches safe, structured data from the platform
5. The model summarizes the answer in plain English
6. Response is returned to the user with bank-safe language and caveats

### Example tool flow

```text
User: Why was my transfer rejected and is my money safe?

AI assistant
  ├─ calls getAccountSummary(accountNumber)
  ├─ calls getRecentTransactions(accountNumber)
  ├─ calls getLockoutDetails(accountNumber)
  └─ returns plain-language explanation using policy context
```

This pattern keeps the assistant grounded in the actual runtime state instead of letting the model improvise responses.

---

## 10. Deployment and runtime notes

### Infrastructure stack

- MySQL: persistent state for accounts and records
- Redis: transient security and fraud state
- Kafka: asynchronous event backbone
- Ollama: optional local LLM runtime

### Recommended startup order

1. Docker infrastructure services
2. MySQL initialization
3. Account service
4. Transaction service
5. Payment and fraud services
6. Notification service
7. API gateway
8. Optional AI service

### Primary ports

- `8080` API Gateway
- `8081` Account Service
- `8082` Transaction Service
- `8083` Payment Service
- `8084` Fraud Detection
- `8085` Notification Service
- `11434` Ollama (optional)

---

## 11. Operational observations

This project demonstrates a practical microservice architecture for banking operations:

- the system is resilient to partial failure
- service boundaries are meaningful and domain-oriented
- security rules sit close to the transactional domain
- asynchronous messaging allows independent evolution of services
- AI integration can provide better customer support without sacrificing data control

This is a strong reference for building banking-grade systems with modern Java and Spring ecosystem patterns.
