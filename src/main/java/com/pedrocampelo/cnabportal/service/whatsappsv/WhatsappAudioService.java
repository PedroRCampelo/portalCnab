package com.pedrocampelo.cnabportal.service.whatsappsv;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;

/**
 * WhatsappAudioService — Sprint WA-4
 *
 * 1. Baixa o áudio da Evolution API (base64)
 * 2. Envia pra OpenAI Whisper pra transcrição
 * 3. Retorna o texto transcrito
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsappAudioService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${openai.api-key:}")
    private String openaiApiKey;

    @Value("${whatsapp.evolution.url:http://157.245.90.220:8080}")
    private String evolutionUrl;

    @Value("${whatsapp.evolution.apikey:daffa157541e2a24191d0d07910db7760c2b6330}")
    private String evolutionApiKey;

    @Value("${whatsapp.evolution.instance:whallet}")
    private String evolutionInstance;

    /**
     * Baixa o áudio da Evolution API e transcreve via Whisper.
     *
     * @param remoteJid  ex: "196219892703351@lid"
     * @param messageId  ex: "3AF6FAFAD5EA90881525"
     * @return texto transcrito ou null se falhar
     */
    public String transcrever(String remoteJid, String messageId) {
        try {
            // 1. Baixa áudio como base64 da Evolution API
            String base64Audio = baixarAudioBase64(remoteJid, messageId);
            if (base64Audio == null || base64Audio.isBlank()) {
                log.warn("[WhatsApp Audio] Não conseguiu baixar áudio: {}", messageId);
                return null;
            }

            // 2. Decodifica base64 pra bytes
            byte[] audioBytes = Base64.getDecoder().decode(base64Audio);
            log.info("[WhatsApp Audio] Áudio baixado: {} bytes", audioBytes.length);

            // 3. Envia pra Whisper API
            String transcricao = chamarWhisper(audioBytes);
            log.info("[WhatsApp Audio] Transcrição: {}", transcricao);

            return transcricao;
        } catch (Exception e) {
            log.error("[WhatsApp Audio] Erro ao transcrever: {}", e.getMessage(), e);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String baixarAudioBase64(String remoteJid, String messageId) {
        try {
            String url = evolutionUrl + "/chat/getBase64FromMediaMessage/" + evolutionInstance;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", evolutionApiKey);

            Map<String, Object> body = Map.of(
                    "message", Map.of(
                            "key", Map.of(
                                    "remoteJid", remoteJid,
                                    "id", messageId
                            )
                    ),
                    "convertToMp4", false
            );

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );

            if (response.getBody() != null && response.getBody().containsKey("base64")) {
                return (String) response.getBody().get("base64");
            }

            return null;
        } catch (Exception e) {
            log.error("[WhatsApp Audio] Erro ao baixar áudio: {}", e.getMessage());
            return null;
        }
    }

    private String chamarWhisper(byte[] audioBytes) {
        try {
            String url = "https://api.openai.com/v1/audio/transcriptions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(openaiApiKey);

            // Cria o arquivo como resource
            ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
                @Override
                public String getFilename() {
                    return "audio.ogg";
                }
            };

            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            formData.add("file", audioResource);
            formData.add("model", "whisper-1");
            formData.add("language", "pt");
            formData.add("response_format", "text");

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(formData, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getBody() != null) {
                return response.getBody().trim();
            }

            return null;
        } catch (Exception e) {
            log.error("[WhatsApp Audio] Erro Whisper: {}", e.getMessage());
            return null;
        }
    }
}