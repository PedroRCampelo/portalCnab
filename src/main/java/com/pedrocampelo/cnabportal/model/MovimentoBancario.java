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
 * Cada movimento representa um evento financeiro real:
 *   - Saldo inicial da conta
 *   - Recebimento (baixa de recebível)
 *   - Pagamento (baixa de título)
 *   - Ajuste manual (correção de saldo)
 *   - Estorno de recebimento
 *   - Estorno de pagamento
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
    // SALDO_INICIAL | RECEBIMENTO | PAGAMENTO | AJUSTE_MANUAL
    // | ESTORNO_RECEBIMENTO | ESTORNO_PAGAMENTO

    @Column(name = "eh_entrada", nullable = false)
    @NotNull
    private Boolean ehEntrada;

    /**
     * Valor SEMPRE POSITIVO. O sinal vem do campo ehEntrada.
     */
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
    // RECEBIMENTO | TITULO | NULL

    @Column(name = "origem_id")
    private UUID origemId;

    // ── Estorno ───────────────────────────────────────────────────────────────

    /**
     * Se este movimento é um estorno, aponta pro movimento original que está
     * sendo anulado. O movimento original NÃO é alterado — apenas marcado
     * como cancelado=true.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimento_estornado_id")
    private MovimentoBancario movimentoEstornado;

    // ── Soft delete ───────────────────────────────────────────────────────────

    @Column(nullable = false)
    @Builder.Default
    private Boolean cancelado = false;

    @Column(name = "motivo_cancelamento", length = 255)
    private String motivoCancelamento;

    // ── Auditoria ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Retorna o valor com sinal aplicado (positivo=entrada, negativo=saída).
     * Útil pra cálculos de saldo.
     */
    public BigDecimal getValorComSinal() {
        return ehEntrada ? valor : valor.negate();
    }

    /**
     * Retorna true se o movimento é "ativo" (não cancelado e relevante para o saldo).
     */
    public boolean isAtivo() {
        return !Boolean.TRUE.equals(cancelado);
    }
}