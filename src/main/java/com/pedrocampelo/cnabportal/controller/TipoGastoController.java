package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.TipoGasto;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import com.pedrocampelo.cnabportal.repository.TipoGastoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/tipos-gasto")
@RequiredArgsConstructor
public class TipoGastoController {

    private final TipoGastoRepository tipoGastoRepository;
    private final EmpresaRepository   empresaRepository;

    @Value("${app.empresa-padrao-id:00000000-0000-0000-0000-000000000001}")
    private String empresaPadraoId;

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

        Empresa empresa = empresaRepository.findById(UUID.fromString(empresaPadraoId))
                .orElseThrow(() -> new IllegalStateException("Empresa não encontrada"));

        TipoGasto tipo = TipoGasto.builder()
                .nome(nome)
                .usuario(usuario)
                .empresa(empresa)
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

        // Verifica duplicata (ignorando o próprio)
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

        // Soft delete — mantém integridade com títulos que usam este tipo
        tipo.setAtivo(false);
        tipoGastoRepository.save(tipo);
        return ResponseEntity.noContent().build();
    }
}