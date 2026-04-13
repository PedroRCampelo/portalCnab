package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.gestaosv.InsightService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/insight")
@RequiredArgsConstructor
@Slf4j
public class InsightController {

    private final InsightService insightService;

    /**
     * GET /api/insight
     *
     * Retorna o insight financeiro do dia.
     * Se já foi gerado hoje, retorna do cache (sem chamar a IA).
     * Se não há dados suficientes, retorna mensagem padrão.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getInsight(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "aurora") String bot) {
        try {
            Map<String, Object> resultado = insightService.gerarOuRecuperarInsight(usuario, bot);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao gerar insight para {}: {}", usuario.getEmail(), e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "insight",    "Não foi possível gerar o insight no momento. Tente novamente mais tarde.",
                    "geradoHoje", false,
                    "versao",     0,
                    "bot",        bot
            ));
        }
    }
}