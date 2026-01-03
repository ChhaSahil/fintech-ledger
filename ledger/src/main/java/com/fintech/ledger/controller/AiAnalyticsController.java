package com.fintech.ledger.controller;

import com.fintech.ledger.ai.FinancialAdvisor;
import com.fintech.ledger.model.Transaction;
import com.fintech.ledger.repository.TransactionRepository;
import com.fintech.ledger.service.JWTService;
import com.fintech.ledger.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AiAnalyticsController {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final JWTService jwtService;
    private final FinancialAdvisor financialAdvisor;

    @PostMapping("/ask")
    public String askAdvisor(
            @RequestHeader("Authorization") String token, @RequestBody String question
    ){
        String email = jwtService.extractUsername(token.substring(7));
        Long accountId = accountRepository.findByEmail(email)
                .orElseThrow(()-> new RuntimeException("User Not Found"))
                .getId();
        List<Transaction> transactions = transactionRepository.findBySourceAccountIdOrTargetAccountIdOrderByTimestampDesc(accountId, accountId);
        if (transactions.isEmpty()) {
            return "I couldn't find any transactions for your account (ID: " + accountId + "). Please make a transaction first.";
        }
        String dataContext = transactions.stream()
                .map(t -> String.format(
                        "Type: %s | Date: %s | Category: %s | Merchant: %s | Note: %s | Amount: %s INR",
                        t.isExpense() ? "EXPENSE" : "INCOME", // ✅ Uses your existing 'isExpense' field
                        t.getTimestamp().toLocalDate(),
                        t.getCategory() != null ? t.getCategory() : "Transfer",
                        t.getMerchantName() != null ? t.getMerchantName() : "N/A",
                        t.getNote() != null ? t.getNote() : "",
                        t.getAmount()
                ))
                .collect(Collectors.joining("\n"));
        System.out.println("--- AI CONTEXT SENT ---\n" + dataContext + "\n-----------------------");
        String prompt = "Here is my transaction history:\n" + dataContext +
                "\n\nMy Question: " + question;
        return financialAdvisor.analyze(prompt);
    }
}
