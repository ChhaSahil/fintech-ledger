package com.fintech.ledger.dto;

import dev.langchain4j.model.output.structured.Description;
import java.math.BigDecimal;

public record ExpenseDetails (

    @Description("The amount of money spent")
    BigDecimal amount,

    @Description("The category of the expense (e.g., Food, Juice,Travel,Utilities)")
    String category,
    @Description("The name of the merchant(e.g., Uber, Starbucks)")
    String merchantName,

    @Description("A short note about the transaction")
    String note,

    @Description("The currency code")
    String currency
    ){}
