package com.banking.gateway.controller;

import com.banking.gateway.dto.AuthResponse;
import com.banking.gateway.dto.LoginRequest;
import com.banking.gateway.security.JwtTokenService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Map<String, DemoUser> DEMO_USERS = Map.of(
        "customer@futuretrust.com", new DemoUser("cust-1001", "customer@futuretrust.com", "ROLE_CUSTOMER", "password123"),
        "admin@futuretrust.com", new DemoUser("comp-1001", "admin@futuretrust.com", "ROLE_COMPLIANCE", "admin123")
    );

    private final JwtTokenService jwtTokenService;

    public AuthController(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        DemoUser user = DEMO_USERS.get(request.getUsername());
        if (user == null || !user.password.equals(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password.");
        }

        String token = jwtTokenService.generateToken(user.userId, user.email, user.role);
        return ResponseEntity.ok(new AuthResponse(token, user.userId, user.email, user.role));
    }

    private record DemoUser(String userId, String email, String role, String password) {
    }
}
