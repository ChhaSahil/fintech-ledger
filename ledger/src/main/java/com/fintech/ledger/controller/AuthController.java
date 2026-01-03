package com.fintech.ledger.controller;

import com.fintech.ledger.model.Account;
import com.fintech.ledger.service.AuthService;
import com.fintech.ledger.dto.RegisterRequest;
import com.fintech.ledger.repository.AccountRepository;
import org.springframework.security.authentication.AuthenticationManager;
import com.fintech.ledger.service.JWTService;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request){
        authService.register(request);
        return ResponseEntity.ok(String.format("User %s registered successfully!", request.ownerName()));
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request){
        Account user = accountRepository.findByEmail(request.getEmail()).orElseThrow(()-> new RuntimeException("User Not Found"));
        if(!passwordEncoder.matches(request.getPassword(),user.getPassword())){
            return ResponseEntity.status(401).body("Invalid Crendentials");
        }

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(token);
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }
}
