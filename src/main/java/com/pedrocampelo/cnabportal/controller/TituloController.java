package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.TituloService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/titulos")
@RequiredArgsConstructor
@Slf4j
public class TituloController {

    private final TituloService tituloService;

    // ── GET /api/titulos — listagem paginada com filtros ──────────────────────
    @GetMapping
    public ResponseEntity<Page<Titulo>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "")  String status,
            @RequestParam(defaultValue = "")  String busca,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {

        return ResponseEntity.ok(
                tituloService.listar(usuario.getId(), status, busca, pagina, Math.min(tamanho, 100))
        );
    }

    // ── GET /api/titulos/resumo — totalizadores para dashboard ────────────────
    @GetMapping("/resumo")
    public ResponseEntity<Map<String, Object>> resumo(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(tituloService.resumo(usuario.getId()));
    }

    // ── POST /api/titulos — cadastro manual ───────────────────────────────────
    @PostMapping
    public ResponseEntity<?> criar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody Titulo titulo) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(tituloService.criar(titulo, usuario));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── PUT /api/titulos/{id} — atualização ───────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @Valid @RequestBody Titulo titulo) {
        try {
            return ResponseEntity.ok(tituloService.atualizar(id, titulo, usuario));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── DELETE /api/titulos/{id} — exclusão ───────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {
        try {
            tituloService.excluir(id, usuario);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // ── Importação Excel ──────────────────────────────────────────────────────
    @PostMapping(value = "/importar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestPart("arquivo") MultipartFile arquivo) {
        try {
            TituloService.ImportacaoResultado resultado =
                    tituloService.importarExcel(arquivo, usuario);
            return ResponseEntity.ok(Map.of(
                    "importados", resultado.importados(),
                    "erros",      resultado.erros()
            ));
        } catch (IOException e) {
            log.error("Erro ao processar Excel: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("mensagem", "Arquivo inválido. Use um .xlsx válido."));
        }
    }

    // ── Tratamento de erros de validação ──────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String mensagem = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(Map.of("mensagem", "Verifique os campos: " + mensagem));
    }
}