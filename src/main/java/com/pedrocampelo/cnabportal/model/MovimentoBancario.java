package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Movimento bancário — uma linha do "livro caixa" do MEI.
 *
 * REGRA DE OURO: movimentos NUNCA são apagados.
 * Pra anular um movimento, criar um movimento de estorno apontando pro original.
 */
@Entity
@Table(name = "movimentos_bancarios")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MovimentoBancario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // ── Multi-tenant + auditoria ──────────────────────────────────────────────

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // ── Conta bancária ────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conta_id", nullable = false)
    private SaldoBancario conta;

    // ── Quando ────────────────────────────────────────────────────────────────

    @Column(name = "data_movimento", nullable = false)
    @NotNull
    private LocalDate dataMovimento;

    // ── O que ─────────────────────────────────────────────────────────────────

    @Column(nullable = false, length = 30)
    @NotBlank
    private String tipo;

    @Column(name = "eh_entrada", nullable = false)
    @NotNull
    private Boolean ehEntrada;

    @Column(nullable = false, precision = 18, scale = 2)
    @NotNull
    @Positive
    private BigDecimal valor;

    @Column(nullable = false, length = 255)
    @NotBlank
    private String descricao;

    // ── Origem (referência ao documento que gerou) ────────────────────────────

    @Column(name = "origem_tipo", length = 30)
    private String origemTipo;

    @Column(name = "origem_id")
    private UUID origemId;

    // ── Estorno ───────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimento_estornado_id")
    private MovimentoBancario movimentoEstornado;

    // ── Soft delete ───────────────────────────────────────────────────────────

    @Column(nullable = false)
    @Builder.Default
    private Boolean cancelado = false;

    @Column(name = "motivo_cancelamento", length = 255)
    private String motivoCancelamento;

    // ── Auditoria — Sprint F1.1 ──────────────────────────────────────────────

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id")
    private Usuario criadoPor;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelado_por_id")
    private Usuario canceladoPor;

    @Column(name = "cancelado_em")
    private LocalDateTime canceladoEm;

    // ── Timestamp ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    // ── Helpers ───────────────────────────────────────────────────────────────

    public BigDecimal getValorComSinal() {
        return ehEntrada ? valor : valor.negate();
    }

    public boolean isAtivo() {
        return !Boolean.TRUE.equals(cancelado);
    }
}
