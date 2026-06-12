package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.service.whatsappsv.WhatsappService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Webhook da Meta WhatsApp Cloud API
 *
 * GET  /api/whatsapp/meta/webhook  — verificação do token (Meta exige isso no setup)
 * POST /api/whatsapp/meta/webhook  — recebe mensagens
 */
@RestController
@RequestMapping("/api/whatsapp/meta")
@RequiredArgsConstructor
@Slf4j
public class MetaWhatsappWebhookController {

    private final WhatsappService whatsappService;

    @Value("${whatsapp.meta.verify-token:whallet_webhook_2026}")
    private String verifyToken;

    /**
     * Verificação do webhook — Meta faz GET com hub.challenge para confirmar a URL.
     */
    @GetMapping("/webhook")
    public ResponseEntity<?> verificar(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.challenge") String challenge,
            @RequestParam("hub.verify_token") String token) {

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            log.info("[WhatsApp/Meta] Webhook verificado com sucesso");
            return ResponseEntity.ok(Integer.parseInt(challenge));
        }
        log.warn("[WhatsApp/Meta] Verificação falhou — token inválido");
        return ResponseEntity.status(403).build();
    }

    /**
     * Recebimento de mensagens da Meta.
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody Map<String, Object> payload) {
        try {
            log.info("[WhatsApp/Meta] Webhook recebido");
            whatsappService.processarMensagemMeta(payload);
        } catch (Exception e) {
            log.error("[WhatsApp/Meta] Erro no webhook: {}", e.getMessage(), e);
        }
        // Meta exige sempre 200 OK
        return ResponseEntity.ok().build();
    }
}
