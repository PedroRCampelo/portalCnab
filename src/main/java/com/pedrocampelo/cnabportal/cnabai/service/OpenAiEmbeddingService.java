package com.pedrocampelo.cnabportal.cnabai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAiEmbeddingService implements EmbeddingService {

    private final ObjectMapper objectMapper;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.embedding.model:text-embedding-3-small}")
    private String embeddingModel;

    private static final int  MAX_RETRIES   = 5;
    private static final long INITIAL_DELAY = 3_000;

    /**
     * Cria um RestTemplate novo a cada chamada — sem connection pooling.
     * Garante que cada embedding abre e fecha sua própria conexão TCP,
     * evitando Connection reset por conexões reutilizadas fechadas pelo servidor.
     */
    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15_000);
        factory.setReadTimeout(30_000);
        return new RestTemplate(factory);
    }

    @Override
    public List<Float> generateEmbedding(String text) {
        Exception lastException = null;

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return doGenerateEmbedding(text);
            } catch (ResourceAccessException e) {
                lastException = e;
                long delay = INITIAL_DELAY * (1L << (attempt - 1)); // 3s, 6s, 12s, 24s, 48s
                log.warn("[Embedding] Tentativa {}/{} falhou ({}). Aguardando {}ms...",
                        attempt, MAX_RETRIES, e.getMessage(), delay);
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Interrompido durante retry.", ie);
                }
            } catch (Exception e) {
                throw new IllegalStateException("Erro ao gerar embedding: " + e.getMessage(), e);
            }
        }

        throw new IllegalStateException(
                "Falha ao gerar embedding após " + MAX_RETRIES + " tentativas: "
                        + (lastException != null ? lastException.getMessage() : "erro desconhecido"),
                lastException
        );
    }

    private List<Float> doGenerateEmbedding(String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = Map.of(
                "model", embeddingModel,
                "input", text
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = buildRestTemplate().postForEntity(
                "https://api.openai.com/v1/embeddings",
                request,
                String.class
        );

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode embeddingNode = root.path("data").get(0).path("embedding");

            List<Float> vector = new ArrayList<>(embeddingNode.size());
            for (JsonNode n : embeddingNode) {
                vector.add((float) n.asDouble());
            }
            return vector;
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao processar resposta de embedding.", e);
        }
    }
}