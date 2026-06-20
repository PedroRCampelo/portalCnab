package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite;
import com.pedrocampelo.cnabportal.dto.PedidoVendaRequest;
import com.pedrocampelo.cnabportal.dto.PedidoVendaResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
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
@RequestMapping("/api/pedidos-venda")
@RequireWhalletPlusWrite
@RequiredArgsConstructor
@Slf4j
public class PedidoVendaController {

    private final PedidoVendaService pedidoVendaService;

    @GetMapping
    public ResponseEntity<Page<PedidoVendaResponse>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID clienteId,
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {

        return ResponseEntity.ok(pedidoVendaService.listar(usuario, status, clienteId, pagina, tamanho));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoVendaResponse> buscarPorId(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.ok(pedidoVendaService.buscarPorId(usuario, id));
    }

    @PostMapping
    public ResponseEntity<PedidoVendaResponse> criar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody PedidoVendaRequest req) {

        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoVendaService.criar(usuario, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PedidoVendaResponse> atualizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @Valid @RequestBody PedidoVendaRequest req) {

        return ResponseEntity.ok(pedidoVendaService.atualizar(usuario, id, req));
    }

    @PostMapping("/{id}/efetivar")
    public ResponseEntity<PedidoVendaResponse> efetivar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.ok(pedidoVendaService.efetivar(usuario, id));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<PedidoVendaResponse> cancelar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.ok(pedidoVendaService.cancelar(usuario, id));
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
