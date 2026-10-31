package com.banking.transaction.exception;

public class TransactionNotFoundException extends ResourceNotFoundException {

    public TransactionNotFoundException(String message) {
        super(message);
    }
}
