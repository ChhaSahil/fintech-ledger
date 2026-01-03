package com.fintech.ledger.controller;

import com.fintech.ledger.model.Transaction;
import com.fintech.ledger.model.Account;
import com.fintech.ledger.repository.AccountRepository;
import com.fintech.ledger.repository.TransactionRepository;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountsController {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @GetMapping("/{id}")
    public Account getAccount(@PathVariable Long id){
        return accountRepository.findById(id).orElseThrow(()->new RuntimeException("Account Not Found"));
    }

    @GetMapping("/me")
    public Account getMyAccount(Principal principal){
        String email = principal.getName();
        return accountRepository.findByEmail(email)
                .orElseThrow(()->new RuntimeException("No User Found"));
    }

    @GetMapping("/me/transactions")
    public List<Transaction> getMyTransactions(Principal principal){
        String email = principal.getName();
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(()-> new RuntimeException("User Not Found"));
        Long id = account.getId();
        return transactionRepository.findBySourceAccountIdOrTargetAccountIdOrderByTimestampDesc(id,id);
    }

    @GetMapping("/{id}/transactions")
    public List<Transaction> getAccountTransactions(@PathVariable Long id){
        return transactionRepository.findBySourceAccountIdOrTargetAccountIdOrderByTimestampDesc(id, id);
    }

    @PatchMapping("/{id}/notifications")
    public Account updateNotificationSettings(@PathVariable Long id, @RequestParam boolean enabled){
        Account account = accountRepository.findById(id).orElseThrow(()-> new RuntimeException("Account Not Found"));
        account.setNotificationsEnabled(enabled);
        return accountRepository.save(account);
    }
}
