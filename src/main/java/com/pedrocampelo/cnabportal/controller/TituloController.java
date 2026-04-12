package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.gestaosv.TituloReportService;
import com.pedrocampelo.cnabportal.service.gestaosv.TituloService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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
    private final TituloReportService tituloReportService;

    // ── GET /api/titulos — listagem paginada com filtros ──────────────────────
    @GetMapping
    public ResponseEntity<Page<Titulo>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String busca,
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

    // ── POST /api/titulos/{id}/baixa — registrar pagamento ───────────────────
    @PostMapping("/{id}/baixa")
    public ResponseEntity<?> baixar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        try {
            BigDecimal valorPago = new BigDecimal(String.valueOf(body.get("valorPago")));
            LocalDate dataBaixa = body.get("dataBaixa") != null
                    ? LocalDate.parse(String.valueOf(body.get("dataBaixa")))
                    : LocalDate.now();
            String observacao = body.get("observacao") != null
                    ? String.valueOf(body.get("observacao"))
                    : "";

            return ResponseEntity.ok(
                    tituloService.registrarBaixa(id, valorPago, dataBaixa, observacao, usuario)
            );
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── GET /api/titulos/exportar/excel ───────────────────────────────────────
    @GetMapping("/exportar/excel")
    public ResponseEntity<?> exportarExcel(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "") String status) {
        try {
            byte[] bytes = tituloReportService.gerarExcel(usuario.getId(), status);
            String filename = "titulos_" + LocalDate.now() + ".xlsx";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentLength(bytes.length)
                    .body(bytes);

        } catch (Exception e) {
            log.error("Erro ao gerar Excel de títulos", e);
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "mensagem", "Erro ao gerar Excel.",
                            "detalhe", e.getMessage() != null ? e.getMessage() : "Erro interno sem detalhe."
                    ));
        }
    }

    // ── GET /api/titulos/exportar/pdf ─────────────────────────────────────────
    @GetMapping("/exportar/pdf")
    public ResponseEntity<?> exportarPdf(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "") String status) {
        try {
            byte[] bytes = tituloReportService.gerarPdf(usuario.getId(), status);
            String filename = "titulos_" + LocalDate.now() + ".pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentLength(bytes.length)
                    .body(bytes);

        } catch (Exception e) {
            log.error("Erro ao gerar PDF de títulos", e);
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "mensagem", "Erro ao gerar PDF.",
                            "detalhe", e.getMessage() != null ? e.getMessage() : "Erro interno sem detalhe."
                    ));
        }
    }

    // ── POST /api/titulos/parcelado — lançamento parcelado ───────────────────
    @PostMapping("/parcelado")
    public ResponseEntity<?> criarParcelado(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, Object> body) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

            Titulo template = mapper.convertValue(body.get("titulo"), Titulo.class);
            int qtd = Integer.parseInt(String.valueOf(body.get("qtdParcelas")));
            int intervalo = Integer.parseInt(String.valueOf(body.get("intervaloDias")));

            List<Titulo> criados = tituloService.criarParcelado(
                    new TituloService.ParceladoRequest(template, qtd, intervalo),
                    usuario
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "criados", criados.size(),
                            "mensagem", criados.size() + " parcelas criadas com sucesso."
                    ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        } catch (Exception e) {
            log.error("Erro ao criar parcelado", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("mensagem", "Erro ao criar parcelas."));
        }
    }

    // ── GET /api/titulos/relatorio — relatório completo ───────────────────────
    @GetMapping("/relatorio")
    public ResponseEntity<Map<String, Object>> relatorio(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(tituloService.relatorioCompleto(usuario.getId()));
    }

    // ── POST /api/titulos/importar — importação por Excel ─────────────────────
    @PostMapping(value = "/importar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestPart("arquivo") MultipartFile arquivo) {
        try {
            TituloService.ImportacaoResultado resultado = tituloService.importarExcel(arquivo, usuario);

            return ResponseEntity.ok(Map.of(
                    "importados", resultado.importados(),
                    "erros", resultado.erros()
            ));
        } catch (IOException e) {
            log.error("Erro ao processar Excel de importação", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("mensagem", "Arquivo inválido. Use um .xlsx válido."));
        } catch (Exception e) {
            log.error("Erro inesperado ao importar Excel", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("mensagem", "Erro interno ao importar arquivo."));
        }
    }

    // ── Tratamento de erros de validação ──────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String mensagem = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        return ResponseEntity.badRequest()
                .body(Map.of("mensagem", "Verifique os campos: " + mensagem));
    }
}