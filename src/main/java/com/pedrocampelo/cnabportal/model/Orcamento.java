package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orcamentos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Orcamento {

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

    // ── Relacionamentos ───────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ItemOrcamento> itens = new ArrayList<>();

    // ── Identificação ─────────────────────────────────────────────────────────

    @Column(length = 20, nullable = false)
    private String numero;

    // RASCUNHO | ENVIADO | APROVADO | RECUSADO | EXPIRADO
    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "RASCUNHO";

    @Column(nullable = false)
    @NotNull
    private LocalDate validade;

    @Column(length = 255)
    @NotBlank
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // ── Valores ───────────────────────────────────────────────────────────────

    @Column(name = "valor_total", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(name = "desconto_geral", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal descontoGeral = BigDecimal.ZERO;

    // ── Condições de pagamento ────────────────────────────────────────────────

    @Column(name = "forma_pagamento", nullable = false, length = 20)
    @Builder.Default
    private String formaPagamento = "A_DEFINIR";

    @Column(name = "num_parcelas", nullable = false)
    @Builder.Default
    private Integer numParcelas = 1;

    @Column(name = "intervalo_dias", nullable = false)
    @Builder.Default
    private Integer intervaloDias = 30;

    // ── Auditoria ─────────────────────────────────────────────────────────────

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
    @JoinColumn(name = "cancelado_por_id")
    private Usuario canceladoPor;

    @Column(name = "cancelado_em")
    private LocalDateTime canceladoEm;

    @Column(name = "aprovado_em")
    private LocalDateTime aprovadoEm;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    // ── Utilitários de domínio ────────────────────────────────────────────────

    public void recalcularTotal() {
        BigDecimal soma = itens.stream()
                .map(ItemOrcamento::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.valorTotal = soma.subtract(this.descontoGeral.compareTo(BigDecimal.ZERO) > 0 ? this.descontoGeral : BigDecimal.ZERO);
    }

    public boolean isEditavel() {
        return "RASCUNHO".equals(this.status) || "ENVIADO".equals(this.status) || "APROVADO".equals(this.status) || "RECUSADO".equals(this.status);
    }

    public boolean isEmPedido() {
        return "EM_PEDIDO".equals(this.status);
    }

    public boolean isExpirado() {
        return LocalDate.now().isAfter(this.validade) && !"APROVADO".equals(this.status) && !"CANCELADO".equals(this.status);
    }
}
