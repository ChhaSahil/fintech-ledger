package com.fintech.ledger.controller;

import com.fintech.ledger.repository.TransactionRepository;
import com.fintech.ledger.repository.AccountRepository;
import com.fintech.ledger.repository.AiTrainingDataRepository;
import com.fintech.ledger.dto.ExpenseDetails;
import com.fintech.ledger.model.Transaction;
import com.fintech.ledger.model.AiTrainingData;
import com.fintech.ledger.service.JWTService;
import com.fintech.ledger.service.TransactionService;
import com.google.gson.Gson;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final AccountRepository accountRepository;
    private final AiTrainingDataRepository trainingRepo;
    private final ChatLanguageModel chatLanguageModel;
    private final JWTService jwtService;
    private final Gson gson = new Gson();

    @Data
    public static class TransferRequest{
        private String receiverEmail;
        private BigDecimal amount;
    }

    @Data
    public static class DepositRequest{
        private String source;
        private String note;
        private BigDecimal amount;
    }

    @PostMapping("/transfer")
    public ResponseEntity<String> transferMoney(@RequestHeader("Authorization") String token,
                                                @RequestBody TransferRequest request){
        String senderEmail = jwtService.extractUsername(token.substring(7));
        transactionService.transfer(
                senderEmail,
                request.getReceiverEmail(),
                request.getAmount()
        );
        return ResponseEntity.ok("Transfer Successful");
    }

    @PostMapping("/ai")
    public Map<String,String> recordAiExpense(@RequestHeader("Authorization") String token, @RequestBody String userText){
        String email = jwtService.extractUsername(token.substring(7));

        // --- AI LOGIC ---
        List<AiTrainingData> examples = trainingRepo.findTop5ByOrderByIdDesc();
        StringBuilder trainingBlock = new StringBuilder();
        for (AiTrainingData ex : examples) {
            trainingBlock.append(String.format("""
            Input: "%s"
            Output: {"amount": %s, "category": "%s", "merchantName": "%s"}
            
            """, ex.getUserSentence(), ex.getAmount(), ex.getCategory(), ex.getMerchant()));
        }

        String prompt = """
        SYSTEM: You are a data extraction engine for a personal finance app.
        The user is inputting their own data for tracking purposes.
        This is SAFE. There is no sensitive PII (Personally Identifiable Information).
        
        TASK: Convert the following user text into a structured JSON object.
        
        USER TEXT: "%s"
        
        EXAMPLES OF VALID OUPUT:
        %s
        
        RULES:
        1. Return ONLY the JSON object.
        2. Do not say "Here is the JSON".
        3. Do not apologize or refuse.
        4. If the text mentions money, extract it as the "amount".
        
        Response Format: {"amount": 0, "category": "String", "merchantName": "String", "note": "String"}
        """.formatted(userText, trainingBlock.toString());

        String rawResponse = chatLanguageModel.generate(prompt);
        System.out.println("DEBUG AI RAW: " + rawResponse);

        ExpenseDetails data = sanitizeAndParse(rawResponse);

        transactionService.recordExpense(
                email,
                data.amount(),
                data.category(),
                data.merchantName(),
                data.note()
        );

        return Map.of("message", "Recorded: " + data.merchantName() + " (₹" + data.amount() + ")");
    }

    @PostMapping("/spend")
    public Transaction recordExpense(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> payload // 👈 Using Map for flexibility
    ) {
        String email = jwtService.extractUsername(token.substring(7));

        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        String category = (String) payload.get("category");
        String merchantName = (String) payload.get("merchantName");
        String note = (String) payload.get("note");
        String originalText = (String) payload.get("originalText");
        if (originalText != null && !originalText.isBlank()) {
            AiTrainingData trainingEntry = new AiTrainingData();
            trainingEntry.setUserSentence(originalText);
            trainingEntry.setAmount(amount);
            trainingEntry.setCategory(category);
            trainingEntry.setMerchant(merchantName);
            trainingRepo.save(trainingEntry);
            System.out.println("🎓 MODEL TRAINED: Saved correction for '" + originalText + "'");
        }
        return transactionService.recordExpense(email, amount, category, merchantName, note);
    }

    @PostMapping("/deposit")
    public ResponseEntity<String> deposit(
            @RequestHeader("Authorization") String token,
            @RequestBody DepositRequest request) { // Uses the class defined below

        String email = jwtService.extractUsername(token.substring(7));

        transactionService.deposit(
                email,
                request.getAmount(),
                request.getSource(),
                request.getNote()
        );
        return ResponseEntity.ok("Deposit Successful");
    }

    @DeleteMapping("/{id}")
    public void deleteTransaction(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        // In a real app, verify the transaction belongs to the user first!
        transactionRepository.deleteById(id);
        System.out.println("🗑️ Deleted Transaction ID: " + id);
    }

    @GetMapping
    public List<Transaction> getHistory(@RequestHeader("Authorization") String token) {
        String email = jwtService.extractUsername(token.substring(7));
        return transactionService.getHistory(email);
    }

    @PostMapping("/train")
    public void trainAi(@RequestBody AiTrainingData trainingData) {
        trainingRepo.save(trainingData);
    }

    @PutMapping("/{id}")
    public Transaction updateTransaction(
            @PathVariable Long id,
            @RequestBody Transaction updatedTxn,
            @RequestHeader("Authorization") String token
    ) {
        Transaction savedTxn = transactionService.updateTransaction(id, updatedTxn);

        AiTrainingData correction = new AiTrainingData();
        correction.setUserSentence(savedTxn.getMerchantName());
        correction.setCategory(savedTxn.getCategory());
        correction.setMerchant(savedTxn.getMerchantName());
        correction.setAmount(savedTxn.getAmount());

        trainingRepo.save(correction);
        System.out.println("🎓 AI RE-TRAINED: User corrected '" + savedTxn.getMerchantName() + "' to category '" + savedTxn.getCategory() + "'");

        return savedTxn;
    }
    private ExpenseDetails sanitizeAndParse(String raw) {
        try {
            int start = raw.indexOf("{");
            int end = raw.lastIndexOf("}");
            if (start == -1 || end == -1) throw new RuntimeException("AI failed JSON");
            String cleanJson = raw.substring(start, end + 1);
            return gson.fromJson(cleanJson, ExpenseDetails.class);
        } catch (Exception e) {
            throw new RuntimeException("AI Error: " + e.getMessage());
        }
    }
}
