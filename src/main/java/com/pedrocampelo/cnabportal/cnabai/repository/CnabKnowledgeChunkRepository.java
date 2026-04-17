package com.pedrocampelo.cnabportal.cnabai.repository;

import com.pedrocampelo.cnabportal.cnabai.model.CnabKnowledgeChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CnabKnowledgeChunkRepository extends JpaRepository<CnabKnowledgeChunk, Long> {

    @Query(value = """
        SELECT
            source_name AS sourceName,
            bank_code AS bankCode,
            cnab_type AS cnabType,
            source_type AS sourceType,
            COUNT(*) AS totalChunks,
            MAX(created_at) AS lastIngestionAt
        FROM cnab_knowledge_chunk
        GROUP BY source_name, bank_code, cnab_type, source_type
        ORDER BY MAX(created_at) DESC
        """, nativeQuery = true)
    List<Object[]> listGroupedDocuments();
}