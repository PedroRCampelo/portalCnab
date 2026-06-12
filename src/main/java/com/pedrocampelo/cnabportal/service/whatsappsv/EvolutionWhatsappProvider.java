package com.pedrocampelo.cnabportal.service.whatsappsv;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class EvolutionWhatsappProvider implements WhatsappProvider {

    @Value("${whatsapp.evolution.url:http://157.245.90.220:8080}")
    private String evolutionUrl;

    @Value("${whatsapp.evolution.apikey:}")
    private String evolutionApiKey;

    @Value("${whatsapp.evolution.instance:whallet}")
    private String evolutionInstance;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void enviarMensagem(String numero, String texto) {
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("apikey", evolutionApiKey);
            restTemplate.postForEntity(
                    evolutionUrl + "/message/sendText/" + evolutionInstance,
                    new HttpEntity<>(Map.of("number", numero, "textMessage", Map.of("text", texto)), h),
                    String.class
            );
            log.info("[WhatsApp/Evolution] Enviado para {}: {}...", numero, texto.substring(0, Math.min(50, texto.length())));
        } catch (Exception e) {
            log.error("[WhatsApp/Evolution] Erro envio para {}: {}", numero, e.getMessage());
        }
    }

    @Override
    public String getNome() { return "evolution"; }
}
