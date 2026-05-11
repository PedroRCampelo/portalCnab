package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite;
import com.pedrocampelo.cnabportal.model.Categoria;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.CategoriaRepository;
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
 * CategoriaController — CRUD de categorias unificadas (receitas e despesas).
 *
 * Sprint F1.2: substitui TipoGastoController.
 *
 * Endpoints:
 *   GET    /api/categorias              — lista todas ativas da empresa
 *   GET    /api/categorias?tipo=RECEITA — filtra por tipo (inclui AMBOS)
 *   POST   /api/categorias              — criar
 *   PUT    /api/categorias/{id}         — editar
 *   DELETE /api/categorias/{id}         — inativar (soft delete)
 */
@RestController
@RequestMapping("/api/categorias")
@RequireWhalletPlusWrite
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaRepository categoriaRepository;

    // ── GET — Listar ──────────────────────────────────────────────────────────

    @GetMapping
    public List<Categoria> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String tipo) {

        UUID empresaId = usuario.getEmpresa().getId();

        if (tipo != null && !tipo.isBlank()) {
            String tipoUpper = tipo.toUpperCase();
            if (!List.of("RECEITA", "DESPESA", "AMBOS").contains(tipoUpper)) {
                return List.of();
            }
            return categoriaRepository.findByEmpresaIdAndTipoOrderByNome(empresaId, tipoUpper);
        }

        return categoriaRepository.findByEmpresaIdAndAtivoTrueOrderByNomeAsc(empresaId);
    }

    // ── POST — Criar ──────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> criar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, String> body) {

        String nome = body.get("nome");
        String tipo = body.getOrDefault("tipo", "AMBOS").toUpperCase();
        String cor  = body.get("cor");

        if (nome == null || nome.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Nome é obrigatório."));
        }
        nome = nome.trim();
        if (nome.length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Nome deve ter no máximo 100 caracteres."));
        }
        if (!List.of("RECEITA", "DESPESA", "AMBOS").contains(tipo)) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Tipo deve ser RECEITA, DESPESA ou AMBOS."));
        }

        UUID empresaId = usuario.getEmpresa().getId();

        if (categoriaRepository.existsByNomeAndTipoAndEmpresa(empresaId, nome, tipo)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("mensagem", "Já existe uma categoria com este nome e tipo."));
        }

        Categoria categoria = Categoria.builder()
                .empresa(usuario.getEmpresa())
                .nome(nome)
                .tipo(tipo)
                .cor(cor)
                .ativo(true)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoriaRepository.save(categoria));
    }

    // ── PUT — Editar ──────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        UUID empresaId = usuario.getEmpresa().getId();

        Categoria categoria = categoriaRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new NoSuchElementException("Categoria não encontrada"));

        String nome = body.get("nome");
        String tipo = body.get("tipo");
        String cor  = body.get("cor");

        if (nome != null && !nome.isBlank()) {
            nome = nome.trim();
            String tipoCheck = tipo != null ? tipo.toUpperCase() : categoria.getTipo();

            if (!categoria.getNome().equalsIgnoreCase(nome)
                    && categoriaRepository.existsByNomeAndTipoAndEmpresa(empresaId, nome, tipoCheck)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("mensagem", "Já existe uma categoria com este nome e tipo."));
            }
            categoria.setNome(nome);
        }

        if (tipo != null && !tipo.isBlank()) {
            String tipoUpper = tipo.toUpperCase();
            if (!List.of("RECEITA", "DESPESA", "AMBOS").contains(tipoUpper)) {
                return ResponseEntity.badRequest().body(Map.of("mensagem", "Tipo deve ser RECEITA, DESPESA ou AMBOS."));
            }
            categoria.setTipo(tipoUpper);
        }

        if (cor != null) {
            categoria.setCor(cor.isBlank() ? null : cor);
        }

        return ResponseEntity.ok(categoriaRepository.save(categoria));
    }

    // ── DELETE — Inativar (soft delete) ───────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {

        UUID empresaId = usuario.getEmpresa().getId();

        Categoria categoria = categoriaRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new NoSuchElementException("Categoria não encontrada"));

        categoria.setAtivo(false);
        categoriaRepository.save(categoria);
        return ResponseEntity.noContent().build();
    }
}