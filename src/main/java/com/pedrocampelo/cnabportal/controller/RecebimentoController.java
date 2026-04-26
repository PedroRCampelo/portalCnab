package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.CobrancaHistoricoResponse;
import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.CobrancaWhatsappResponse;
import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.GerarCobrancaRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.ReceberRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoParceladoRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.recebimentossv.CobrancaService;
import com.pedrocampelo.cnabportal.service.recebimentossv.RecebimentoService;
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
@RequestMapping("/api/recebimentos")
@RequiredArgsConstructor
@Slf4j
public class RecebimentoController {

    private final RecebimentoService recebimentoService;
    private final CobrancaService    cobrancaService;

    // ── Listagem ──────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<RecebimentoResponse>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID clienteId,
            @RequestParam(defaultValue = "0")  int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ResponseEntity.ok(recebimentoService.listar(usuario, status, clienteId, pagina, tamanho));
    }

    @GetMapping("/resumo")
    public ResponseEntity<Map<String, Object>> resumo(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(recebimentoService.resumo(usuario));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@AuthenticationPrincipal Usuario usuario,
                                         @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(recebimentoService.buscarPorId(usuario, id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── Criação ───────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> criar(@AuthenticationPrincipal Usuario usuario,
                                   @Valid @RequestBody RecebimentoRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(recebimentoService.criar(usuario, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }

    /**
     * Criação parcelada: cria N recebimentos com mesmo número e parcelas sequenciais.
     */
    @PostMapping("/parcelado")
    public ResponseEntity<?> criarParcelado(@AuthenticationPrincipal Usuario usuario,
                                            @Valid @RequestBody RecebimentoParceladoRequest request) {
        try {
            List<RecebimentoResponse> criados = recebimentoService.criarParcelado(usuario, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(criados);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@AuthenticationPrincipal Usuario usuario,
                                       @PathVariable UUID id,
                                       @Valid @RequestBody RecebimentoRequest request) {
        try {
            return ResponseEntity.ok(recebimentoService.atualizar(usuario, id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── Operações de status ───────────────────────────────────────────────────

    @PostMapping("/{id}/receber")
    public ResponseEntity<?> receber(@AuthenticationPrincipal Usuario usuario,
                                     @PathVariable UUID id,
                                     @RequestBody(required = false) ReceberRequest request) {
        try {
            ReceberRequest req = request != null ? request : new ReceberRequest(null, null);
            return ResponseEntity.ok(recebimentoService.receber(usuario, id, req));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    /**
     * Estorno da baixa — desfaz o recebimento, zerando o valor recebido.
     * Operação rastreável (gera log). No futuro, deve reverter saldo bancário.
     */
    @PostMapping("/{id}/estornar")
    public ResponseEntity<?> estornar(@AuthenticationPrincipal Usuario usuario,
                                      @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(recebimentoService.estornarBaixa(usuario, id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@AuthenticationPrincipal Usuario usuario,
                                      @PathVariable UUID id) {
        try {
            return ResponseEntity.ok(recebimentoService.cancelar(usuario, id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@AuthenticationPrincipal Usuario usuario,
                                     @PathVariable UUID id) {
        try {
            recebimentoService.excluir(usuario, id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // ── Cobrança WhatsApp ─────────────────────────────────────────────────────

    @PostMapping("/{id}/cobranca/preview")
    public ResponseEntity<?> previewCobranca(@AuthenticationPrincipal Usuario usuario,
                                             @PathVariable UUID id,
                                             @Valid @RequestBody GerarCobrancaRequest request) {
        try {
            CobrancaWhatsappResponse preview = cobrancaService.gerarPreview(usuario, id, request);
            return ResponseEntity.ok(preview);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cobranca/registrar")
    public ResponseEntity<?> registrarCobranca(@AuthenticationPrincipal Usuario usuario,
                                               @PathVariable UUID id,
                                               @Valid @RequestBody GerarCobrancaRequest request) {
        try {
            cobrancaService.registrarEnvio(usuario, id, request);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }

    @GetMapping("/{id}/cobranca/historico")
    public ResponseEntity<?> historicoCobrancas(@AuthenticationPrincipal Usuario usuario,
                                                @PathVariable UUID id) {
        try {
            List<CobrancaHistoricoResponse> historico = cobrancaService.historico(usuario, id);
            return ResponseEntity.ok(historico);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        }
    }
}