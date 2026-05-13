package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite;
import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.reports.RelatorioExportService;
import com.pedrocampelo.cnabportal.service.gestaosv.TituloService;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/titulos")
@RequireWhalletPlusWrite
@RequiredArgsConstructor
@Slf4j
public class TituloController {

    private final TituloService       tituloService;
    private final RelatorioExportService relatorioExportService;

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

    // Planos com acesso a gestão financeira (títulos)
    private static final java.util.UUID PLANO_WHALLET_PLUS =
            java.util.UUID.fromString("10000000-0000-0000-0000-000000000003");

    private boolean temAcessoGestao(Usuario usuario) {
        return usuario.getPerfil() != null && usuario.getPerfil().name().equals("ADMIN")
                || PLANO_WHALLET_PLUS.equals(usuario.getPlanoId());
    }

    // ── POST /api/titulos — cadastro manual ───────────────────────────────────
    @PostMapping
    public ResponseEntity<?> criar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody Titulo titulo) {
        if (!temAcessoGestao(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("mensagem", "Recurso disponível apenas no plano Whallet+."));
        }
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
        if (!temAcessoGestao(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("mensagem", "Recurso disponível apenas no plano Whallet+."));
        }
        try {
            return ResponseEntity.ok(tituloService.atualizar(id, titulo, usuario));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── DELETE /api/titulos/{id} — exclusão ───────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {
        if (!temAcessoGestao(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        try {
            tituloService.excluir(id, usuario);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── POST /api/titulos/{id}/baixa — registrar pagamento ───────────────────
    // ATUALIZADO: aceita contaId no body
    @PostMapping("/{id}/baixa")
    public ResponseEntity<?> baixar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        if (!temAcessoGestao(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("mensagem", "Recurso disponível apenas no plano Whallet+."));
        }
        try {
            BigDecimal valorPago = new BigDecimal(String.valueOf(body.get("valorPago")));
            LocalDate dataBaixa  = body.get("dataBaixa") != null
                    ? LocalDate.parse(String.valueOf(body.get("dataBaixa")))
                    : LocalDate.now();
            String observacao    = body.get("observacao") != null
                    ? String.valueOf(body.get("observacao")) : "";

            // NOVO: contaId opcional (qual conta paga o título)
            UUID contaId = null;
            if (body.get("contaId") != null && !String.valueOf(body.get("contaId")).isBlank()) {
                contaId = UUID.fromString(String.valueOf(body.get("contaId")));
            }

            return ResponseEntity.ok(
                    tituloService.registrarBaixa(id, valorPago, dataBaixa, observacao, contaId, usuario)
            );
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── POST /api/titulos/{id}/estornar — desfazer pagamento ─────────────────
    // NOVO: estorna a baixa do título (cria movimento de compensação)
    @PostMapping("/{id}/estornar")
    public ResponseEntity<?> estornar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {
        if (!temAcessoGestao(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("mensagem", "Recurso disponível apenas no plano Whallet+."));
        }
        try {
            return ResponseEntity.ok(tituloService.estornarBaixa(id, usuario));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── GET /api/titulos/exportar/excel ───────────────────────────────────────
    @GetMapping("/exportar/excel")
    public ResponseEntity<byte[]> exportarExcel(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "") String status) {
        try {
            byte[] bytes = relatorioExportService.gerarTitulosExcel(usuario.getId(), status);
            String filename = "titulos_" + java.time.LocalDate.now() + ".xlsx";
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(bytes);
        } catch (Exception e) {
            log.error("Erro ao gerar Excel de títulos: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── GET /api/titulos/exportar/pdf ─────────────────────────────────────────
    @GetMapping("/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "") String status) {
        try {
            byte[] bytes = relatorioExportService.gerarTitulosPdf(usuario.getId(), status);
            String filename = "titulos_" + java.time.LocalDate.now() + ".pdf";
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .header("Content-Type", "application/pdf")
                    .body(bytes);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de títulos: {} — {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── POST /api/titulos/parcelado — lançamento parcelado ───────────────────
    @PostMapping("/parcelado")
    public ResponseEntity<?> criarParcelado(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, Object> body) {
        if (!temAcessoGestao(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("mensagem", "Recurso disponível apenas no plano Whallet+."));
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            Titulo template = mapper.convertValue(body.get("titulo"), Titulo.class);
            int qtd         = Integer.parseInt(String.valueOf(body.get("qtdParcelas")));
            int intervalo   = Integer.parseInt(String.valueOf(body.get("intervaloDias")));

            List<Titulo> criados = tituloService.criarParcelado(
                    new TituloService.ParceladoRequest(template, qtd, intervalo), usuario);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("criados", criados.size(), "mensagem",
                            criados.size() + " parcelas criadas com sucesso."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        } catch (Exception e) {
            log.error("Erro ao criar parcelado: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("mensagem", "Erro ao criar parcelas."));
        }
    }

    // ── GET /api/titulos/relatorio — relatório completo ───────────────────────
    @GetMapping("/relatorio")
    public ResponseEntity<Map<String, Object>> relatorio(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(tituloService.relatorioCompleto(usuario.getId()));
    }

    @PostMapping(value = "/importar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestPart("arquivo") MultipartFile arquivo) {
        if (!temAcessoGestao(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("mensagem", "Recurso disponível apenas no plano Whallet+."));
        }
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
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(Map.of("mensagem", "Verifique os campos: " + mensagem));
    }
}