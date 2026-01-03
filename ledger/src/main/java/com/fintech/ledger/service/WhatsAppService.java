package com.fintech.ledger.service;

import com.fintech.ledger.model.Account;
import com.fintech.ledger.repository.AccountRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WhatsAppService {
    private final AccountRepository accountRepository;

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String fromNumber;

    @PostConstruct
    public void init(){
        Twilio.init(accountSid, authToken);
    }

    @Scheduled(cron = "0 * * * * *")
    public void sendScheduledBalanceAlert(){
        Iterable<Account> allAccounts = accountRepository.findAll();
        for (Account account : allAccounts){
            if(account.getPhoneNumber()!=null && !account.getPhoneNumber().isBlank() && account.isNotificationsEnabled()) {
                String messageBody = "🔔 *Fintech Alert*\n\n" +
                        "Hello " + account.getOwnerName() + ",\n" +
                        "Your current balance is: *$" + account.getBalance() + "*\n\n" +
                        "Have a great day!";

                sendMessage(account.getPhoneNumber(), messageBody);
            }
        }
    }

    private void sendMessage(String to, String body) {
        try {
            Message message = Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(fromNumber),
                    body
            ).create();

            System.out.println("✅ WhatsApp sent! SID: " + message.getSid());
        } catch (Exception e) {
            System.err.println("❌ Failed to send WhatsApp: " + e.getMessage());
        }
    }

}
