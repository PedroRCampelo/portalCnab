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
@Table(name = "pedidos_venda")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PedidoVenda {

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

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carga_id")
    private Carga carga;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orcamento_id")
    private Orcamento orcamento;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ItemPedidoVenda> itens = new ArrayList<>();

    // ── Identificação ─────────────────────────────────────────────────────────

    @Column(length = 20, nullable = false)
    private String numero;

    // ABERTO | EFETIVADO | CANCELADO
    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "ABERTO";

    @Column(length = 255)
    @NotBlank
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // ── Valores ───────────────────────────────────────────────────────────────

    @Column(name = "valor_total", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal valorTotal = BigDecimal.ZERO;

    // ── Condições de pagamento ────────────────────────────────────────────────

    @Column(name = "forma_pagamento", nullable = false, length = 20)
    @Builder.Default
    private String formaPagamento = "PIX";

    @Column(name = "num_parcelas", nullable = false)
    @Builder.Default
    private Integer numParcelas = 1;

    @Column(name = "intervalo_dias", nullable = false)
    @Builder.Default
    private Integer intervaloDias = 30;

    @Column(name = "primeiro_vencimento", nullable = false)
    @NotNull
    private LocalDate primeiroVencimento;

    @Column(name = "categoria_id")
    private UUID categoriaId;

    @Column(name = "endereco_entrega", length = 500)
    private String enderecoEntrega;

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
    @JoinColumn(name = "efetivado_por_id")
    private Usuario efetivadoPor;

    @Column(name = "efetivado_em")
    private LocalDateTime efetivadoEm;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelado_por_id")
    private Usuario canceladoPor;

    @Column(name = "cancelado_em")
    private LocalDateTime canceladoEm;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    // ── Utilitários de domínio ────────────────────────────────────────────────

    public boolean isEditavel() {
        return "ABERTO".equals(this.status) || "EM_CARGA".equals(this.status);
    }

    public boolean isEfetivavel() {
        return ("ABERTO".equals(this.status) || "EM_CARGA".equals(this.status)) && !this.itens.isEmpty();
    }

    public boolean isEmCarga() {
        return "EM_CARGA".equals(this.status);
    }

    public void recalcularTotal() {
        this.valorTotal = itens.stream()
                .map(ItemPedidoVenda::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
