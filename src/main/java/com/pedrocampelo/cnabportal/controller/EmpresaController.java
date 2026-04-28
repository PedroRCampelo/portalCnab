package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaResponse;
import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaUpdateRequest;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.gestaosv.EmpresaService;
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
}