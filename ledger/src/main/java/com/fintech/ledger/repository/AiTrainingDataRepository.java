package com.fintech.ledger.repository;

import com.fintech.ledger.model.AiTrainingData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiTrainingDataRepository extends JpaRepository<AiTrainingData,Long> {
    List<AiTrainingData> findTop5ByOrderByIdDesc();
}
