package com.fintech.ledger.repository;

import com.fintech.ledger.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("Select t from UserTransaction t where t.sourceAccountId = :accountId OR t.targetAccountId = :accountId Order by t.timestamp desc")
    List<Transaction> findAllByAccountId(@Param("accountId") Long accountId);

    List<Transaction> findBySourceAccountIdOrTargetAccountIdOrderByTimestampDesc(Long sourceId, Long targetId);
}
