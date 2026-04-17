package com.pedrocampelo.cnabportal.cnabai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenAiEmbeddingService implements EmbeddingService {

    private final ObjectMapper objectMapper;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.embedding.model:text-embedding-3-small}")
    private String embeddingModel;

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .build();

    @Override
    public List<Float> generateEmbedding(String text) {
        Map<String, Object> body = Map.of(
                "model", embeddingModel,
                "input", text
        );

        String response = restClient.post()
                .uri("/embeddings")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode embeddingNode = root.path("data").get(0).path("embedding");

            List<Float> vector = new ArrayList<>(embeddingNode.size());
            for (JsonNode n : embeddingNode) {
                vector.add((float) n.asDouble());
            }
            return vector;
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao processar embedding da OpenAI.", e);
        }
    }
}