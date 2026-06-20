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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/empresa")
@RequiredArgsConstructor
@Slf4j
public class EmpresaController {

    private final EmpresaService empresaService;
    private final TermometroService termometroService;

    @GetMapping
    public ResponseEntity<EmpresaResponse> buscarMinha(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(empresaService.buscarMinha(usuario));
    }

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
     * POST /api/empresa/logo
     * Recebe um arquivo de imagem, converte para base64 e salva.
     * Limite: 500 KB.
     */
    @PostMapping("/logo")
    public ResponseEntity<?> uploadLogo(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam("arquivo") MultipartFile arquivo) {
        if (arquivo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Arquivo vazio."));
        }
        if (arquivo.getSize() > 500 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Logo deve ter no máximo 500 KB."));
        }
        String contentType = arquivo.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Arquivo deve ser uma imagem."));
        }
        try {
            byte[] bytes = arquivo.getBytes();
            String base64 = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(bytes);
            return ResponseEntity.ok(empresaService.salvarLogo(usuario, base64));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("mensagem", "Erro ao processar imagem."));
        }
    }

    /**
     * DELETE /api/empresa/logo
     * Remove a logo da empresa.
     */
    @DeleteMapping("/logo")
    public ResponseEntity<EmpresaResponse> removerLogo(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(empresaService.salvarLogo(usuario, null));
    }

    @GetMapping("/termometro-faturamento")
    public ResponseEntity<TermometroFaturamentoResponse> termometroFaturamento(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(termometroService.calcular(usuario));
    }
}
