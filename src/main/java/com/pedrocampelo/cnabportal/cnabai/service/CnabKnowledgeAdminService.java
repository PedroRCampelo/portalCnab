package com.pedrocampelo.cnabportal.cnabai.service;

import com.pedrocampelo.cnabportal.cnabai.dto.CnabKnowledgeDocumentDTO;
import com.pedrocampelo.cnabportal.cnabai.repository.CnabKnowledgeChunkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CnabKnowledgeAdminService {

    private final CnabKnowledgeChunkRepository repository;

    public List<CnabKnowledgeDocumentDTO> listDocuments() {
        return repository.listGroupedDocuments()
                .stream()
                .map(this::mapRow)
                .toList();
    }

    private CnabKnowledgeDocumentDTO mapRow(Object[] row) {
        String sourceName = (String) row[0];
        String bankCode = (String) row[1];
        String cnabType = (String) row[2];
        String sourceType = (String) row[3];
        Long totalChunks = row[4] instanceof Number ? ((Number) row[4]).longValue() : 0L;

        LocalDateTime lastIngestionAt = null;
        if (row[5] instanceof Timestamp timestamp) {
            lastIngestionAt = timestamp.toLocalDateTime();
        }

        return CnabKnowledgeDocumentDTO.builder()
                .sourceName(sourceName)
                .bankCode(bankCode)
                .cnabType(cnabType)
                .sourceType(sourceType)
                .totalChunks(totalChunks)
                .lastIngestionAt(lastIngestionAt)
                .build();
    }
}