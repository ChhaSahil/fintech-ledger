package com.fintech.ledger.ai;

import com.fintech.ledger.dto.ExpenseDetails;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.spring.AiService;

@AiService
public interface FinancialAgent {

    @SystemMessage("""
        You are a strict data parser. 
        Your ONLY job is to extract expense details from the user's text.
        
        OUTPUT FORMAT:
        You MUST return a valid JSON object matching this structure:
        {
           "amount": 100.50,
           "category": "Food",
           "merchantName": "Walmart",
           "note": "grocery shopping"
        }
        
        RULES:
        1. return ONLY the JSON. No markdown (```json), no conversational text, no "Here is the JSON".
        2. If the currency is not specified, assume the number is the amount.
        3. If a category is not clear, guess one (e.g., Food, Travel, Utilities).
        4. If merchant is missing, use null.
    """)
    ExpenseDetails parse(@UserMessage String userText);
}