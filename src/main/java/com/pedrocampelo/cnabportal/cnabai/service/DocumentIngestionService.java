package com.pedrocampelo.cnabportal.cnabai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pedrocampelo.cnabportal.cnabai.repository.CnabVectorSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionService {

    private final PdfTextExtractorService pdfTextExtractorService;
    private final com.pedrocampelo.cnabportal.cnabai.service.ChunkingService chunkingService;
    private final EmbeddingService embeddingService;
    private final CnabVectorSearchRepository vectorRepository;
    private final ObjectMapper objectMapper;

    /**
     * Ingere um PDF na base de conhecimento.
     *
     * @param file       arquivo PDF
     * @param descricao  descrição livre fornecida pelo admin, ex: "Sicredi 240 pagamento"
     *                   Usado como source_name e para inferir bank_code/cnab_type como metadado.
     * @param sourceType tipo da fonte, ex: "PDF_LAYOUT"
     */
    @Async("elvisTaskExecutor")
    public void ingestPdf(
            MultipartFile file,
            String descricao,
            String sourceType
    ) {
        // Infere banco e tipo da descrição livre — apenas para metadado, não para filtro
        String bankCode  = inferirBanco(descricao);
        String cnabType  = inferirTipo(descricao);
        String sourceName = (descricao != null && !descricao.isBlank())
                ? descricao.trim()
                : file.getOriginalFilename();

        log.info("[Ingestão] arquivo={} descricao='{}' banco_inferido={} tipo_inferido={}",
                file.getOriginalFilename(), descricao, bankCode, cnabType);

        String extractedText = pdfTextExtractorService.extractText(file);
        List<String> chunks  = chunkingService.chunkText(extractedText);

        log.info("[Ingestão] chunks gerados={}", chunks.size());

        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("sourceName",  sourceName);
            metadata.put("descricao",   descricao);
            metadata.put("bankCode",    bankCode);
            metadata.put("cnabType",    cnabType);
            metadata.put("sourceType",  sourceType);
            metadata.put("chunkIndex",  i);

            log.info("[Ingestão] processando chunk {}/{} ({} chars)", i + 1, chunks.size(), chunk.length());

            // Trunca chunk se muito grande — limite da OpenAI é ~8191 tokens (~32000 chars)
            String chunkParaEmbedding = chunk.length() > 30_000 ? chunk.substring(0, 30_000) : chunk;

            List<Float> embedding = embeddingService.generateEmbedding(chunkParaEmbedding);

            // Delay de 1s entre chunks para respeitar rate limit da OpenAI
            try { Thread.sleep(1_000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

            try {
                vectorRepository.insertChunkWithEmbedding(
                        sourceName,
                        bankCode,
                        cnabType,
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
                throw new IllegalStateException(
                        "Falha ao ingerir chunk " + i + " de '" + sourceName + "'", e);
            }
        }

        log.info("[Ingestão] concluída — {} chunks salvos para '{}'", chunks.size(), sourceName);
    }

    /**
     * Infere o banco a partir da descrição livre.
     * Retorna null se não reconhecer — não obriga o usuário a seguir nomenclatura.
     */
    private String inferirBanco(String descricao) {
        if (descricao == null || descricao.isBlank()) return null;
        String d = descricao.toLowerCase();
        if (d.contains("itau") || d.contains("itaú") || d.contains("341")) return "itau";
        if (d.contains("bradesco") || d.contains("237"))                    return "bradesco";
        if (d.contains("banco do brasil") || d.contains("bb") || d.contains("001")) return "bb";
        if (d.contains("caixa") || d.contains("cef") || d.contains("104")) return "caixa";
        if (d.contains("sicredi") || d.contains("748"))                     return "sicredi";
        if (d.contains("sicoob") || d.contains("756"))                      return "sicoob";
        if (d.contains("santander") || d.contains("033"))                   return "santander";
        if (d.contains("unicred") || d.contains("136"))                     return "unicred";
        if (d.contains("banrisul") || d.contains("041"))                    return "banrisul";
        return null; // banco desconhecido — tudo bem, busca semântica não depende disso
    }

    /**
     * Infere o tipo CNAB a partir da descrição livre.
     */
    private String inferirTipo(String descricao) {
        if (descricao == null || descricao.isBlank()) return null;
        String d = descricao.toLowerCase();
        if (d.contains("240")) return "cnab240";
        if (d.contains("400")) return "cnab400";
        return null;
    }

    private Integer estimateTokens(String text) {
        return Math.max(1, text.length() / 4);
    }
}