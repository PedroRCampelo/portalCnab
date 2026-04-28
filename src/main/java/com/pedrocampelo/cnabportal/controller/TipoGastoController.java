package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlus;
import com.pedrocampelo.cnabportal.model.TipoGasto;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.TipoGastoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Controller de Tipos de Gasto.
 *
 * MUDANÇA Sprint 2.2-A1: Remove empresaPadraoId. Empresa vem do usuário logado.
 */
@RestController
@RequestMapping("/api/tipos-gasto")
@RequireWhalletPlus
@RequiredArgsConstructor
public class TipoGastoController {

    private final TipoGastoRepository tipoGastoRepository;

    @GetMapping
    public List<TipoGasto> listar(@AuthenticationPrincipal Usuario usuario) {
        return tipoGastoRepository.findByUsuarioIdAndAtivoTrueOrderByNomeAsc(usuario.getId());
    }

    @PostMapping
    public ResponseEntity<?> criar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, String> body) {

        String nome = body.get("nome");
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Nome é obrigatório."));
        }
        nome = nome.trim();
        if (nome.length() > 20) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Nome deve ter no máximo 100 caracteres."));
        }

        if (tipoGastoRepository.existsByNomeIgnoreCaseAndUsuarioIdAndAtivoTrue(nome, usuario.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensagem", "Já existe um tipo de gasto com este nome."));
        }

        TipoGasto tipo = TipoGasto.builder()
                .nome(nome)
                .usuario(usuario)
                .empresa(usuario.getEmpresa())     // ← antes: empresaPadraoId
                .ativo(true)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(tipoGastoRepository.save(tipo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        TipoGasto tipo = tipoGastoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tipo de gasto não encontrado"));

        if (!tipo.getUsuario().getId().equals(usuario.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String nome = body.get("nome");
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Nome é obrigatório."));
        }
        nome = nome.trim();

        if (!tipo.getNome().equalsIgnoreCase(nome) &&
                tipoGastoRepository.existsByNomeIgnoreCaseAndUsuarioIdAndAtivoTrue(nome, usuario.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensagem", "Já existe um tipo de gasto com este nome."));
        }

        tipo.setNome(nome);
        return ResponseEntity.ok(tipoGastoRepository.save(tipo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        TipoGasto tipo = tipoGastoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tipo de gasto não encontrado"));

        if (!tipo.getUsuario().getId().equals(usuario.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        tipo.setAtivo(false);
        tipoGastoRepository.save(tipo);
        return ResponseEntity.noContent().build();
    }
}