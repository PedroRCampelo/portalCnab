package com.pedrocampelo.cnabportal.cnabai.service;

import com.pedrocampelo.cnabportal.cnabai.dto.RetrievedChunkDTO;
import com.pedrocampelo.cnabportal.cnabai.repository.CnabVectorSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VectorSearchService {

    private final EmbeddingService embeddingService;
    private final CnabVectorSearchRepository vectorSearchRepository;

    @Value("${cnab.ai.top-k:5}")
    private int topK;

    public List<RetrievedChunkDTO> searchRelevantChunks(
            String question,
            String bankCode,
            String cnabType
    ) {
        List<Float> questionEmbedding = embeddingService.generateEmbedding(question);
        return vectorSearchRepository.searchSimilar(
                questionEmbedding,
                normalizeBank(bankCode),
                normalizeCnabType(cnabType),
                topK
        );
    }

    private String normalizeBank(String value) {
        if (value == null || value.isBlank()) return null;
        return switch (value.trim().toLowerCase()) {
            case "341", "itau", "itaú"           -> "itau";
            case "237", "bradesco"               -> "bradesco";
            case "001", "bb", "banco do brasil"  -> "bb";
            case "104", "caixa", "cef"           -> "caixa";
            default -> value.trim().toLowerCase();
        };
    }

    private String normalizeCnabType(String value) {
        if (value == null || value.isBlank()) return null;
        return switch (value.trim().toLowerCase()) {
            case "240", "cnab240", "cnab 240" -> "cnab240";
            case "400", "cnab400", "cnab 400" -> "cnab400";
            default -> value.trim().toLowerCase();
        };
    }
}