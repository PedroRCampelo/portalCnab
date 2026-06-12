package com.pedrocampelo.cnabportal.service.whatsappsv;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class MetaWhatsappProvider implements WhatsappProvider {

    @Value("${whatsapp.meta.phone-number-id:}")
    private String phoneNumberId;

    @Value("${whatsapp.meta.access-token:}")
    private String accessToken;

    private static final String GRAPH_URL = "https://graph.facebook.com/v19.0";

    private final RestTemplate restTemplate;

    public MetaWhatsappProvider() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(20_000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public void enviarMensagem(String numero, String texto) {
        try {
            // Garante formato numérico puro com código do país
            String to = numero.replaceAll("\\D", "");
            if (!to.startsWith("55")) to = "55" + to;

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.setBearerAuth(accessToken);

            Map<String, Object> body = Map.of(
                    "messaging_product", "whatsapp",
                    "to", to,
                    "type", "text",
                    "text", Map.of("body", texto)
            );

            var resp = restTemplate.postForEntity(
                    GRAPH_URL + "/" + phoneNumberId + "/messages",
                    new HttpEntity<>(body, h),
                    String.class
            );

            log.info("[WhatsApp/Meta] Enviado para {} | status={} | body={}",
                    to, resp.getStatusCode(),
                    resp.getBody() != null ? resp.getBody().substring(0, Math.min(80, resp.getBody().length())) : "null");

        } catch (Exception e) {
            log.error("[WhatsApp/Meta] Erro envio para {}: {}", numero, e.getMessage());
        }
    }

    @Override
    public String getNome() { return "meta"; }
}
