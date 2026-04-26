package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.AjusteSaldoRequest;
import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaldoRequest;
import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaldoResponse;
import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaldoUpdateRequest;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.SaldoBancarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/saldos-bancarios")
@RequiredArgsConstructor
@Slf4j
public class SaldoBancarioController {

    private final SaldoBancarioService saldoService;

    @GetMapping
    public ResponseEntity<List<SaldoResponse>> listar(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(saldoService.listar(usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@AuthenticationPrincipal Usuario usuario,
                                         @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(saldoService.buscarPorId(usuario, id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> criar(@AuthenticationPrincipal Usuario usuario,
                                   @Valid @RequestBody SaldoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(saldoService.criar(usuario, request));
    }

    /**
     * Atualiza dados cadastrais (nome, banco, principal).
     * NÃO altera saldo — para isso, use POST /{id}/ajustar.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@AuthenticationPrincipal Usuario usuario,
                                       @PathVariable UUID id,
                                       @Valid @RequestBody SaldoUpdateRequest request) {
        try {
            return ResponseEntity.ok(saldoService.atualizar(usuario, id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }

    /**
     * Ajusta o saldo da conta — cria movimento AJUSTE_MANUAL com o delta.
     * Body: { "saldoReal": 4800.00, "motivo": "opcional" }
     */
    @PostMapping("/{id}/ajustar")
    public ResponseEntity<?> ajustarSaldo(@AuthenticationPrincipal Usuario usuario,
                                          @PathVariable UUID id,
                                          @Valid @RequestBody AjusteSaldoRequest request) {
        try {
            return ResponseEntity.ok(saldoService.ajustarSaldo(usuario, id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> inativar(@AuthenticationPrincipal Usuario usuario,
                                      @PathVariable UUID id) {
        try {
            saldoService.inativar(usuario, id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }
}