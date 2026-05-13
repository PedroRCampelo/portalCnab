package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "recebimentos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Recebimento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // ── Multi-tenant ──────────────────────────────────────────────────────────

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // ── Cliente ───────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    // ── Identificação ─────────────────────────────────────────────────────────

    /**
     * Código legível do recebimento (RC-00001).
     * Chave de negócio pra o usuário referenciar.
     * Gerado automaticamente no service.
     */
    @Column(length = 20)
    private String codigo;

    /**
     * Número do recebimento — agrupador de parcelas.
     * Recebimentos parcelados compartilham o mesmo número e diferem em parcelaAtual.
     */
    @Column(length = 20)
    private String numero;

    @Column(length = 3)
    @Builder.Default
    private String parcela = "01";

    /** Chave composta: numero + parcela */
    @Column(length = 30)
    private String chave;

    public void montarChave() {
        if (this.numero != null && this.parcela != null) {
            this.chave = this.numero + this.parcela;
        }
    }

    @Column(nullable = false, length = 255)
    @NotBlank
    private String descricao;

    @Column(length = 50)
    private String categoria;

    /**
     * FK para tabela categorias (Sprint F1.2).
     * Substitui o campo 'categoria' (string livre) que será deprecado.
     */
    @Column(name = "categoria_id")
    private UUID categoriaId;

    /** Canal de criação: MANUAL, WHATSAPP, IMPORTACAO, API */
    @Column(name = "origem", nullable = false, length = 20)
    @Builder.Default
    private String origem = "MANUAL";

    // ── Datas ─────────────────────────────────────────────────────────────────

    @Column(name = "data_emissao", nullable = false)
    @Builder.Default
    private LocalDate dataEmissao = LocalDate.now();

    @Column(name = "data_vencimento", nullable = false)
    @NotNull
    private LocalDate dataVencimento;

    @Column(name = "data_recebimento")
    private LocalDate dataRecebimento;

    // ── Valores ───────────────────────────────────────────────────────────────

    @Column(nullable = false, precision = 18, scale = 2)
    @NotNull
    @Positive
    private BigDecimal valor;

    @Column(name = "valor_recebido", nullable = false, precision = 18, scale = 2)
    @PositiveOrZero
    @Builder.Default
    private BigDecimal valorRecebido = BigDecimal.ZERO;

    // ── Forma de pagamento ────────────────────────────────────────────────────

    @Column(name = "forma_pagamento", nullable = false, length = 20)
    @Builder.Default
    private String formaPagamento = "PIX";

    // ── Parcelamento ──────────────────────────────────────────────────────────

    @Column(name = "parcela_atual", nullable = false)
    @Builder.Default
    private Integer parcelaAtual = 1;

    @Column(name = "parcela_total", nullable = false)
    @Builder.Default
    private Integer parcelaTotal = 1;

    // ── Recorrência ───────────────────────────────────────────────────────────

    @Column(nullable = false)
    @Builder.Default
    private Boolean recorrente = false;

    @Column(name = "recorrencia_tipo", length = 10)
    private String recorrenciaTipo;

    // ── Status ────────────────────────────────────────────────────────────────

    @Column(nullable = false, length = 15)
    @Builder.Default
    private String status = "PENDENTE";

    @Column(columnDefinition = "TEXT")
    private String observacao;

    // ── Auditoria — Sprint F1.1 ──────────────────────────────────────────────

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id")
    private Usuario criadoPor;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alterado_por_id")
    private Usuario alteradoPor;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baixado_por_id")
    private Usuario baixadoPor;

    @Column(name = "baixado_em")
    private LocalDateTime baixadoEm;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelado_por_id")
    private Usuario canceladoPor;

    @Column(name = "cancelado_em")
    private LocalDateTime canceladoEm;

    // ── Timestamps ────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    // ── Utilitários de domínio ────────────────────────────────────────────────

    public void atualizarStatus() {
        if ("CANCELADO".equals(this.status)) return;

        if (this.valorRecebido.compareTo(this.valor) >= 0) {
            this.status = "RECEBIDO";
            if (this.dataRecebimento == null) {
                this.dataRecebimento = LocalDate.now();
            }
            return;
        }

        if (this.valorRecebido.compareTo(BigDecimal.ZERO) > 0) {
            this.status = "PARCIAL";
            return;
        }

        if (this.dataVencimento != null && this.dataVencimento.isBefore(LocalDate.now())) {
            this.status = "ATRASADO";
        } else {
            this.status = "PENDENTE";
        }
    }

    public BigDecimal getSaldoPendente() {
        return this.valor.subtract(this.valorRecebido);
    }

    public boolean temBaixa() {
        return this.valorRecebido.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean estaFinalizado() {
        return "RECEBIDO".equals(this.status) || "CANCELADO".equals(this.status);
    }
}