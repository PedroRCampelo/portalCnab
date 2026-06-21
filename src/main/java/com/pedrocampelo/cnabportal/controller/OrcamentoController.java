package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite;
import com.pedrocampelo.cnabportal.dto.OrcamentoRequest;
import com.pedrocampelo.cnabportal.dto.OrcamentoResponse;
import com.pedrocampelo.cnabportal.dto.PedidoVendaResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.comercialsv.OrcamentoService;
import com.pedrocampelo.cnabportal.service.comercialsv.PedidoVendaService;
import jakarta.validation.Valid;
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

@RestController
@RequestMapping("/api/orcamentos")
@RequireWhalletPlusWrite
@RequiredArgsConstructor
@Slf4j
public class OrcamentoController {

    private final OrcamentoService   orcamentoService;
    private final PedidoVendaService pedidoVendaService;

    @GetMapping
    public ResponseEntity<Page<OrcamentoResponse>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID clienteId,
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {

        return ResponseEntity.ok(orcamentoService.listar(usuario, status, clienteId, pagina, tamanho));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrcamentoResponse> buscarPorId(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.ok(orcamentoService.buscarPorId(usuario, id));
    }

    @PostMapping
    public ResponseEntity<OrcamentoResponse> criar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody OrcamentoRequest req) {

        return ResponseEntity.status(HttpStatus.CREATED).body(orcamentoService.criar(usuario, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrcamentoResponse> atualizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @Valid @RequestBody OrcamentoRequest req) {

        return ResponseEntity.ok(orcamentoService.atualizar(usuario, id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrcamentoResponse> mudarStatus(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @RequestParam String status) {

        return ResponseEntity.ok(orcamentoService.mudarStatus(usuario, id, status));
    }

    @PostMapping("/{id}/converter-pedido")
    public ResponseEntity<PedidoVendaResponse> converterEmPedido(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pedidoVendaService.converterDeOrcamento(usuario, id));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erro", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArg(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
    }
}
