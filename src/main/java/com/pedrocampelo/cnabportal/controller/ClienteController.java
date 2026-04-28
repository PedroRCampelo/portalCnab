package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlus;
import com.pedrocampelo.cnabportal.dto.ClienteRequest;
import com.pedrocampelo.cnabportal.dto.ClienteResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.recebimentossv.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/clientes")
@RequireWhalletPlus
@RequiredArgsConstructor
@Slf4j
public class ClienteController {

    private final ClienteService clienteService;

    // GET /api/clientes — lista paginada
    @GetMapping
    public ResponseEntity<Page<ClienteResponse>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ResponseEntity.ok(clienteService.listar(usuario, pagina, tamanho));
    }

    // GET /api/clientes/buscar?termo=joao — autocomplete
    @GetMapping("/buscar")
    public ResponseEntity<List<ClienteResponse>> buscar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String termo) {
        return ResponseEntity.ok(clienteService.buscarPorNome(usuario, termo));
    }

    // GET /api/clientes/{id} — detalhe (com estatísticas)
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(clienteService.buscarPorId(usuario, id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensagem", e.getMessage()));
        }
    }

    // POST /api/clientes — criação
    @PostMapping
    public ResponseEntity<?> criar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody ClienteRequest request) {
        try {
            ClienteResponse criado = clienteService.criar(usuario, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(criado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensagem", e.getMessage()));
        }
    }

    // PUT /api/clientes/{id} — edição
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @Valid @RequestBody ClienteRequest request) {
        try {
            return ResponseEntity.ok(clienteService.atualizar(usuario, id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensagem", e.getMessage()));
        }
    }

    // DELETE /api/clientes/{id} — soft delete (inativa)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> inativar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {
        try {
            clienteService.inativar(usuario, id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensagem", e.getMessage()));
        }
    }
}