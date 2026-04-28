package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.MovimentoResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.MovimentoBancarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
     * Extrato consolidado da empresa com filtros opcionais.
     *
     * GET /api/movimentos-bancarios
     *   ?pagina=0&tamanho=20
     *   &contaId={uuid}    — opcional, filtra por conta
     *   &tipo=RECEBIMENTO  — opcional, filtra por tipo de movimento
     *   &dataInicio=2026-04-01
     *   &dataFim=2026-04-30
     */
    @GetMapping
    public ResponseEntity<Page<MovimentoResponse>> extrato(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) UUID contaId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {

        // Tratamento amigável: tipo vazio vira null
        String tipoLimpo = (tipo != null && !tipo.isBlank()) ? tipo.toUpperCase() : null;

        return ResponseEntity.ok(
                movimentoService.extratoFiltrado(usuario, contaId, tipoLimpo, dataInicio, dataFim, pagina, tamanho)
        );
    }

    /**
     * Extrato de uma conta específica (sem filtros adicionais).
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