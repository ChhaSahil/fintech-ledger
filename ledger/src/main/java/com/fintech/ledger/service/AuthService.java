package com.fintech.ledger.service;

import com.fintech.ledger.dto.RegisterRequest;
import com.fintech.ledger.model.Account;
import com.fintech.ledger.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public Account register(RegisterRequest request){
        if (accountRepository.findByEmail(request.email()).isPresent()){
            throw new RuntimeException("Email already Exists");
        }
        Account account = new Account();
        account.setOwnerName(request.ownerName());
        account.setEmail(request.email());
        account.setPhoneNumber(request.phoneNumber());

        account.setPassword(passwordEncoder.encode(request.password()));

        account.setBalance(BigDecimal.ZERO);
        account.setNotificationsEnabled(false);
        account.setCreatedAt(LocalDateTime.now());
        account.setAccountNumber("ACC-" + (System.currentTimeMillis() % 100000));

        return accountRepository.save(account);
    }
}
