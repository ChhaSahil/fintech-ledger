package com.fintech.ledger;

import com.fintech.ledger.model.Account;
import com.fintech.ledger.model.Transaction;
import com.fintech.ledger.repository.TransactionRepository;
import com.fintech.ledger.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if(accountRepository.count()==0){
            Account akash = new Account();
            akash.setAccountNumber("ACC-101");
            akash.setOwnerName("Akash Banerjee");
            akash.setEmail("akash@example.com");
            akash.setBalance(new BigDecimal("1000.00"));
            akash.setPassword(passwordEncoder.encode("pass123"));
            akash.setPhoneNumber("9876543210");
            akash.setCreatedAt(LocalDateTime.now());

            Account ramesh = new Account();
            ramesh.setCreatedAt(LocalDateTime.now());
            ramesh.setAccountNumber("ACC-102");
            ramesh.setBalance(new BigDecimal("1500.00"));
            ramesh.setEmail("ramesh@example.com");
            ramesh.setPassword(passwordEncoder.encode("pass123"));
            ramesh.setPhoneNumber("9976543210");
            ramesh.setOwnerName("Ramesh Chauhan");

            accountRepository.save(akash);
            accountRepository.save(ramesh);

            System.out.println("DEMO-DATA-LOADED");
        }
    }
}
