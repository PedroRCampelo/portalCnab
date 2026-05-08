package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaResponse;
import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaUpdateRequest;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.dto.TermometroFaturamentoResponse;
import com.pedrocampelo.cnabportal.service.gestaosv.EmpresaService;
import com.pedrocampelo.cnabportal.service.gestaosv.TermometroService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Endpoints de gestão da empresa do MEI logado.
 *
 * MEI sempre acessa SUA empresa — não há listar/criar/excluir via API.
 */
@RestController
@RequestMapping("/api/empresa")
@RequiredArgsConstructor
@Slf4j
public class EmpresaController {

    private final EmpresaService empresaService;
    private final TermometroService termometroService;
    /**
     * GET /api/empresa
     * Retorna dados e configurações da empresa do MEI logado.
     */
    @GetMapping
    public ResponseEntity<EmpresaResponse> buscarMinha(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(empresaService.buscarMinha(usuario));
    }

    /**
     * PUT /api/empresa
     * Atualiza configurações editáveis da empresa.
     */
    @PutMapping
    public ResponseEntity<?> atualizarMinha(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody EmpresaUpdateRequest request) {
        try {
            return ResponseEntity.ok(empresaService.atualizarMinha(usuario, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    /**
     * GET /api/empresa/termometro-faturamento
     * Retorna o termômetro de faturamento do ano corrente.
     *
     * Sprint 2.2-B · Termômetro MEI
     *
     * Calcula: faturado no ano, percentual do limite, projeção de estouro.
     * Funciona pra qualquer regime com limite cadastrado, mas é otimizado
     * pra MEI (limite padrão R$ 81.000).
     */
    @GetMapping("/termometro-faturamento")
    public ResponseEntity<TermometroFaturamentoResponse> termometroFaturamento(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(termometroService.calcular(usuario));
    }
}