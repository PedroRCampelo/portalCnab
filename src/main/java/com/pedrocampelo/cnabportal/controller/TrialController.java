package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.gestaosv.TrialService;
import com.pedrocampelo.cnabportal.service.gestaosv.TrialService.TrialStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints do Trial 7 dias
 *
 * POST /api/trial/ativar    → ativa trial (opt-in)
 * GET  /api/trial/status    → retorna status do trial
 */
@RestController
@RequestMapping("/api/trial")
@RequiredArgsConstructor
public class TrialController {

    private final TrialService trialService;

    /**
     * POST /api/trial/ativar
     * Ativa trial de 7 dias do Whallet+.
     * Retorna 200 se ativou, 400 se já usou ou já tem assinatura.
     */
    @PostMapping("/ativar")
    public ResponseEntity<?> ativarTrial(@AuthenticationPrincipal Usuario usuario) {
        try {
            trialService.ativarTrial(usuario);
            TrialStatus status = trialService.status(usuario);
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Trial de 7 dias ativado com sucesso!",
                    "trial", status
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "mensagem", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/trial/status
     * Retorna status do trial do usuário logado.
     */
    @GetMapping("/status")
    public ResponseEntity<TrialStatus> statusTrial(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(trialService.status(usuario));
    }
}