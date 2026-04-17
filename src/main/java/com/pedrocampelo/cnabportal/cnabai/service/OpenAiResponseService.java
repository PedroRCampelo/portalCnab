package com.pedrocampelo.cnabportal.cnabai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenAiResponseService {

    private final ObjectMapper objectMapper;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.chat.model:gpt-4o-mini}")
    private String chatModel;

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .build();

    public String generateAnswer(String instructions, String input) {
        Map<String, Object> body = Map.of(
                "model", chatModel,
                "instructions", instructions,
                "input", input
        );

        String response = restClient.post()
                .uri("/responses")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(response);

            if (root.hasNonNull("output_text")) {
                return root.get("output_text").asText();
            }

            JsonNode output = root.path("output");
            if (output.isArray() && !output.isEmpty()) {
                JsonNode first = output.get(0);
                JsonNode content = first.path("content");
                if (content.isArray() && !content.isEmpty()) {
                    return content.get(0).path("text").asText("");
                }
            }

            throw new IllegalStateException("Resposta da OpenAI sem texto retornado.");
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao interpretar resposta da OpenAI.", e);
        }
    }
}