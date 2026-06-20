package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Entity
@Table(name = "itens_orcamento")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ItemOrcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orcamento_id", nullable = false)
    private Orcamento orcamento;

    @Column(length = 255, nullable = false)
    @NotBlank
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 3)
    @Positive
    @Builder.Default
    private BigDecimal quantidade = BigDecimal.ONE;

    @Column(name = "valor_unitario", nullable = false, precision = 18, scale = 2)
    @Positive
    private BigDecimal valorUnitario;

    @Column(nullable = false, precision = 18, scale = 2)
    @PositiveOrZero
    @Builder.Default
    private BigDecimal desconto = BigDecimal.ZERO;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordem = 0;

    public void calcularSubtotal() {
        BigDecimal bruto = this.quantidade.multiply(this.valorUnitario).setScale(2, RoundingMode.HALF_UP);
        this.subtotal = bruto.subtract(this.desconto).max(BigDecimal.ZERO);
    }
}
