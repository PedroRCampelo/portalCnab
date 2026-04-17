package com.pedrocampelo.cnabportal.cnabai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pedrocampelo.cnabportal.cnabai.repository.CnabVectorSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentIngestionService {

    private final PdfTextExtractorService pdfTextExtractorService;
    private final com.pedrocampelo.cnabportal.service.cnabaisv.ChunkingService chunkingService;
    private final EmbeddingService embeddingService;
    private final CnabVectorSearchRepository vectorRepository;
    private final ObjectMapper objectMapper;

    public void ingestPdf(
            MultipartFile file,
            String bankCode,
            String cnabType,
            String sourceType
    ) {
        String normalizedBank = normalizeBank(bankCode);
        String normalizedType = normalizeCnabType(cnabType);

        String extractedText = pdfTextExtractorService.extractText(file);
        List<String> chunks = chunkingService.chunkText(extractedText);

        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("sourceName", file.getOriginalFilename());
            metadata.put("bankCode",   normalizedBank);
            metadata.put("cnabType",   normalizedType);
            metadata.put("sourceType", sourceType);
            metadata.put("chunkIndex", i);

            List<Float> embedding = embeddingService.generateEmbedding(chunk);

            try {
                vectorRepository.insertChunkWithEmbedding(
                        file.getOriginalFilename(),
                        normalizedBank,
                        normalizedType,
                        null,
                        null,
                        sourceType,
                        i,
                        chunk,
                        estimateTokens(chunk),
                        objectMapper.writeValueAsString(metadata),
                        embedding
                );
            } catch (Exception e) {
                throw new IllegalStateException("Falha ao ingerir chunk " + i + " do documento " + file.getOriginalFilename(), e);
            }
        }
    }

    private String normalizeBank(String value) {
        if (value == null) return null;
        return switch (value.trim().toLowerCase()) {
            case "341", "itau", "itaú"           -> "itau";
            case "237", "bradesco"               -> "bradesco";
            case "001", "bb", "banco do brasil"  -> "bb";
            case "104", "caixa", "cef"           -> "caixa";
            default -> value.trim().toLowerCase();
        };
    }

    private String normalizeCnabType(String value) {
        if (value == null) return null;
        return switch (value.trim().toLowerCase()) {
            case "240", "cnab240", "cnab 240" -> "cnab240";
            case "400", "cnab400", "cnab 400" -> "cnab400";
            default -> value.trim().toLowerCase();
        };
    }

    private Integer estimateTokens(String text) {
        return Math.max(1, text.length() / 4);
    }


}