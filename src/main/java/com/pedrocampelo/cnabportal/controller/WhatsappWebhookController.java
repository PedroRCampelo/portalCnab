package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.whatsappsv.WhatsappService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * WhatsappWebhookController — Sprint WA-1
 *
 * POST /api/whatsapp/webhook       — webhook da Evolution API (público)
 * POST /api/whatsapp/ativar        — usuário solicita vinculação (autenticado)
 * GET  /api/whatsapp/status        — status da vinculação (autenticado)
 */
@RestController
@RequestMapping("/api/whatsapp")
@RequiredArgsConstructor
@Slf4j
public class WhatsappWebhookController {

    private final WhatsappService whatsappService;

    /**
     * Webhook da Evolution API — público (sem auth JWT).
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody Map<String, Object> payload) {
        try {
            String event = (String) payload.get("event");
            if (!"messages.upsert".equals(event)) {
                return ResponseEntity.ok().build();
            }

            log.info("[WhatsApp] Webhook recebido: event={}", event);
            log.info("[WhatsApp] Webhook PAYLOAD: {}", payload);
            whatsappService.processarMensagem(payload);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("[WhatsApp] Erro no webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok().build();
        }
    }

    // Planos com acesso ao Bot WhatsApp
    private static final java.util.UUID PLANO_WHALLET_PLUS =
            java.util.UUID.fromString("10000000-0000-0000-0000-000000000003");

    private boolean temAcessoBot(Usuario usuario) {
        return (usuario.getPerfil() != null && usuario.getPerfil().name().equals("ADMIN"))
                || PLANO_WHALLET_PLUS.equals(usuario.getPlanoId());
    }

    /**
     * Usuário solicita ativação do WhatsApp.
     * Body: { "telefone": "81996774063" }
     * Envia código de verificação via WhatsApp.
     */
    @PostMapping("/ativar")
    public ResponseEntity<?> ativar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, String> body) {
        try {
            if (!temAcessoBot(usuario)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("mensagem", "O Bot WhatsApp está disponível apenas no plano Whallet+. Assine para ativar."));
            }

            String telefone = body.get("telefone");
            if (telefone == null || telefone.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("mensagem", "Informe o número de telefone."));
            }

            whatsappService.iniciarVinculacao(usuario, telefone);

            return ResponseEntity.ok(Map.of(
                    "mensagem", "Código de verificação enviado via WhatsApp.",
                    "telefone", telefone
            ));
        } catch (Exception e) {
            log.error("[WhatsApp] Erro ao ativar: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("mensagem", e.getMessage()));
        }
    }

    /**
     * Verifica status da vinculação WhatsApp do usuário.
     */
    @GetMapping("/status")
    public ResponseEntity<?> status(@AuthenticationPrincipal Usuario usuario) {
        var status = whatsappService.verificarStatus(usuario);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/verificar")
    public ResponseEntity<?> verificarCodigo(@AuthenticationPrincipal Usuario usuario,
                                             @RequestBody Map<String, String> body) {
        try {
            whatsappService.verificarCodigo(usuario, body.get("codigo"));
            return ResponseEntity.ok(Map.of("mensagem", "WhatsApp verificado!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    /**
     * Desvincular WhatsApp do usuário.
     */
    @DeleteMapping("/desvincular")
    public ResponseEntity<?> desvincular(@AuthenticationPrincipal Usuario usuario) {
        try {
            whatsappService.desvincular(usuario);
            return ResponseEntity.ok(Map.of("mensagem", "WhatsApp desvinculado."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }
}