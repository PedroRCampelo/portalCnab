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

    @Value("${cnab.ai.top-k:10}")
    private int topK;

    /**
     * Busca chunks relevantes por similaridade semântica pura.
     * banco e tipo são ignorados na busca — servem apenas como contexto
     * para o prompt da IA, não como filtros de banco de dados.
     */
    public List<RetrievedChunkDTO> searchRelevantChunks(
            String question,
            String bankCode,
            String cnabType
    ) {
        // Enriquece a query com banco e tipo para melhorar a busca semântica
        // Ex: "verifique divergências" + "Itaú CNAB 400" → embedding mais direcionado
        String queryEnriquecida = question;
        if (bankCode != null && !bankCode.isBlank()) {
            queryEnriquecida = bankCode + " " + (cnabType != null ? cnabType : "") + " " + question;
        }

        List<Float> questionEmbedding = embeddingService.generateEmbedding(queryEnriquecida);
        return vectorSearchRepository.searchSimilar(questionEmbedding, topK);
    }
}