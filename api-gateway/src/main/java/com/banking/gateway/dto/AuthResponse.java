package com.banking.gateway.dto;

public class AuthResponse {

    private final String token;
    private final String userId;
    private final String email;
    private final String role;

    public AuthResponse(String token, String userId, String email, String role) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
}
