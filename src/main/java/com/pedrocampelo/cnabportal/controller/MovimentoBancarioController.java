package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.MovimentoResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.MovimentoBancarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Endpoints de consulta de extrato bancário.
 *
 * Movimentos NÃO são criados via API — eles surgem das operações de:
 *   - Recebimento (receber/estornar)
 *   - Título (pagar/estornar)
 *   - Ajuste manual de saldo (POST /api/saldos-bancarios/{id}/ajustar)
 */
@RestController
@RequestMapping("/api/movimentos-bancarios")
@RequiredArgsConstructor
@Slf4j
public class MovimentoBancarioController {

    private final MovimentoBancarioService movimentoService;

    /**
     * Extrato consolidado da empresa (todas as contas).
     *
     * GET /api/movimentos-bancarios?pagina=0&tamanho=20
     */
    @GetMapping
    public ResponseEntity<Page<MovimentoResponse>> extratoConsolidado(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ResponseEntity.ok(movimentoService.extratoConsolidado(usuario, pagina, tamanho));
    }

    /**
     * Extrato de uma conta específica.
     *
     * GET /api/movimentos-bancarios/conta/{contaId}?pagina=0&tamanho=20
     */
    @GetMapping("/conta/{contaId}")
    public ResponseEntity<?> extratoPorConta(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID contaId,
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        try {
            return ResponseEntity.ok(movimentoService.extratoPorConta(usuario, contaId, pagina, tamanho));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }
}