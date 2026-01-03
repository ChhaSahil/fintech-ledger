package com.fintech.ledger.service;

import com.fintech.ledger.repository.AccountRepository;
import com.fintech.ledger.repository.TransactionRepository;
import com.fintech.ledger.model.Account;
import com.fintech.ledger.model.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    //We do not need this since we use RequiredArgsConstructor
//    public TransferService(AccountRepository accountRepository, TransactionRepository transactionRepository){
//        this.accountRepository = accountRepository;
//        this.transactionRepository = transactionRepository;
//    }

    private Account getAccountByEmail(String email){
        return accountRepository.findByEmail(email)
                .orElseThrow(()->new RuntimeException("Account not found for email: " + email));
    }

    @Transactional
    public Transaction deposit(String email, BigDecimal amount, String source,String note){
        if(amount.compareTo(BigDecimal.ZERO)<=0){
            throw new IllegalArgumentException("Deposit amount must be positive");
        }
        Account user = getAccountByEmail(email);

        user.setBalance(user.getBalance().add(amount));
        accountRepository.save(user);

        Transaction transaction = new Transaction();
        transaction.setTargetAccountId(user.getId());
        transaction.setSourceAccountId(null);
        transaction.setAmount(amount);
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setCurrency("₹");
        transaction.setCategory("Income");
        transaction.setCategory(source);
        transaction.setNote(note);
        transaction.setExpense(false);
        return transactionRepository.save(transaction);
    }
    @Transactional
    public void transfer(String senderEmail, String receiverEmail, BigDecimal amount){
        if(amount.compareTo(BigDecimal.ZERO)<=0){
          throw new IllegalArgumentException("Transfer amount must be positive");
        }
        Account sender = getAccountByEmail(senderEmail);
        Account receiver = getAccountByEmail(receiverEmail);

        if(sender.getId().equals(receiver.getId())){
            throw new IllegalArgumentException("You cannot transfer money to the same account");
        }

        if(sender.getBalance().compareTo(amount)<0){
            throw new RuntimeException("Insufficient funds");
        }
        BigDecimal senderNewBalance = sender.getBalance().subtract(amount);
        BigDecimal receiverNewBalance = receiver.getBalance().add(amount);

        sender.setBalance(senderNewBalance);
        receiver.setBalance(receiverNewBalance);

        accountRepository.save(sender);
        accountRepository.save(receiver);

        Transaction transaction = new Transaction();
        transaction.setSourceAccountId(sender.getId());
        transaction.setTargetAccountId(receiver.getId());
        transaction.setAmount(amount);
        transaction.setCurrency("₹");
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setStatus("Success");
        transaction.setNote("Transfer to " + receiver.getOwnerName());

        transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction recordExpense(String email, BigDecimal amount, String category, String merchant, String note){
        if(amount.compareTo(BigDecimal.ZERO)<=0){
            throw new RuntimeException("Amount cannot be less than or equal to ZERO");
        }

        Account account = getAccountByEmail(email);
        if(account.getBalance().compareTo(amount)<0){
            throw new RuntimeException("Insufficient funds for transfer");
        }

        account.setBalance(account.getBalance().subtract(amount));
        accountRepository.save(account);

        Transaction transaction = new Transaction();
        transaction.setExpense(true);
        transaction.setSourceAccountId(account.getId());
        transaction.setCurrency("₹");
        transaction.setTargetAccountId(null);
        transaction.setTimestamp(LocalDateTime.now());
        transaction.setStatus("Success");
        transaction.setAmount(amount);
        transaction.setCategory(category);
        transaction.setMerchantName(merchant);
        transaction.setNote(note);

        return transactionRepository.save(transaction);
    }

    public List<Transaction> getHistory(String email){
        Account user = getAccountByEmail(email);
        return transactionRepository.findAllByAccountId(user.getId());
    }

    public Transaction updateTransaction(Long id, Transaction updatedDetails) {
        Transaction existing = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        existing.setCategory(updatedDetails.getCategory());
        existing.setMerchantName(updatedDetails.getMerchantName());
        existing.setAmount(updatedDetails.getAmount());
        existing.setNote(updatedDetails.getNote());

        return transactionRepository.save(existing);
    }
}
