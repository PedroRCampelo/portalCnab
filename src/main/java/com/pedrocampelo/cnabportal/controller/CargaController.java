package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite;
import com.pedrocampelo.cnabportal.dto.CargaRequest;
import com.pedrocampelo.cnabportal.dto.CargaResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.comercialsv.CargaService;
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
@RequestMapping("/api/cargas")
@RequireWhalletPlusWrite
@RequiredArgsConstructor
@Slf4j
public class CargaController {

    private final CargaService cargaService;

    @GetMapping
    public ResponseEntity<Page<CargaResponse>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {

        return ResponseEntity.ok(cargaService.listar(usuario, status, pagina, tamanho));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CargaResponse> buscar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.ok(cargaService.buscarPorId(usuario, id));
    }

    @PostMapping
    public ResponseEntity<CargaResponse> criar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody CargaRequest req) {

        return ResponseEntity.status(HttpStatus.CREATED).body(cargaService.criar(usuario, req));
    }

    @PostMapping("/{id}/pedidos")
    public ResponseEntity<CargaResponse> adicionarPedido(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        UUID pedidoId = UUID.fromString(body.get("pedidoId"));
        String endereco = body.get("enderecoEntrega");
        return ResponseEntity.ok(cargaService.adicionarPedido(usuario, id, pedidoId, endereco));
    }

    @DeleteMapping("/{id}/pedidos/{pedidoId}")
    public ResponseEntity<CargaResponse> removerPedido(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @PathVariable UUID pedidoId) {

        return ResponseEntity.ok(cargaService.removerPedido(usuario, id, pedidoId));
    }

    @PatchMapping("/{id}/pedidos/{pedidoId}/endereco")
    public ResponseEntity<CargaResponse> atualizarEndereco(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @PathVariable UUID pedidoId,
            @RequestBody Map<String, String> body) {

        return ResponseEntity.ok(cargaService.atualizarEndereco(usuario, id, pedidoId, body.get("enderecoEntrega")));
    }

    @PostMapping("/{id}/finalizar")
    public ResponseEntity<CargaResponse> finalizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.ok(cargaService.finalizar(usuario, id));
    }

    @PostMapping("/{id}/reabrir")
    public ResponseEntity<CargaResponse> reabrir(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.ok(cargaService.reabrir(usuario, id));
    }

    @GetMapping("/{id}/json-roteirizacao")
    public ResponseEntity<Map<String, Object>> jsonRoteirizacao(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        return ResponseEntity.ok(cargaService.gerarJsonRoteirizacao(usuario, id));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erro", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception e) {
        log.error("Erro inesperado em Carga: {}", e.getMessage(), e);
        return ResponseEntity.internalServerError().body(Map.of("erro", "Erro interno ao processar carga."));
    }
}
