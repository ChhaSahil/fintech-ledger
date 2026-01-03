package com.fintech.ledger.dto;

public record RegisterRequest (
        String ownerName,
        String email,
        String password,
        String phoneNumber
){}
