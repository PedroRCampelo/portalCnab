package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaudeMesResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.FluxoCaixaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fluxo-caixa")
@RequiredArgsConstructor
@Slf4j
public class FluxoCaixaController {

    private final FluxoCaixaService fluxoCaixaService;

    /**
     * GET /api/fluxo-caixa/saude-mes
     *
     * Retorna o estado de saúde financeira do mês atual:
     *   - Saldo atual (calculado via movimentos)
     *   - A receber esse mês
     *   - A pagar esse mês
     *   - Sobra ou falta projetada
     *   - Alerta preditivo (se saldo for ficar negativo nos próximos 60 dias)
     */
    @GetMapping("/saude-mes")
    public ResponseEntity<SaudeMesResponse> saudeMes(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(fluxoCaixaService.calcularSaudeMes(usuario));
    }
}