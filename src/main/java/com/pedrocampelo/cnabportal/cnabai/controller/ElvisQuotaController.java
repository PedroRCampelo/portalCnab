package com.pedrocampelo.cnabportal.cnabai.controller;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.gestaosv.ElvisQuotaService;
import com.pedrocampelo.cnabportal.service.gestaosv.ElvisQuotaService.StatusUso;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint informativo de quota do Elvis.
 * Sprint A3.9.3
 *
 * Permite o frontend consultar quantas perguntas o usuário já fez no mês
 * sem precisar fazer uma pergunta. Usado pelo CotaBadge / ElvisMiniChat
 * pra exibir "3 de 5 perguntas usadas este mês".
 *
 * Exemplo de resposta (Free com 3 perguntas usadas):
 *   GET /api/elvis/uso-mensal
 *   {
 *     "ilimitado": false,
 *     "usadas": 3,
 *     "limite": 5,
 *     "restantes": 2,
 *     "anoMes": "2026-04",
 *     "podePerguntar": true
 *   }
 *
 * Exemplo Whallet+ ou Admin:
 *   {
 *     "ilimitado": true,
 *     "usadas": 0,
 *     "limite": null,
 *     "restantes": null,
 *     "anoMes": "2026-04",
 *     "podePerguntar": true
 *   }
 */
@RestController
@RequestMapping("/api/elvis")
@RequiredArgsConstructor
public class ElvisQuotaController {

    private final ElvisQuotaService elvisQuotaService;

    @GetMapping("/uso-mensal")
    public ResponseEntity<StatusUso> usoMensal(@AuthenticationPrincipal Usuario usuario) {
        // Anônimo: retorna estrutura "ilimitada" pra não confundir
        // (frontend nunca vai chamar isso anônimo, mas defensive)
        if (usuario == null) {
            return ResponseEntity.ok(new StatusUso(
                    true, 0, null, null,
                    com.pedrocampelo.cnabportal.model.ElvisUsoMensal.anoMesAtual(),
                    true
            ));
        }
        return ResponseEntity.ok(elvisQuotaService.status(usuario));
    }
}