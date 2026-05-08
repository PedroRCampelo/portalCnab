package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa a tabela 'planos'.
 *
 * Sprint 2.2-A1.4: criada pra suportar PlanoGuard.
 * Sprint A3.9: adiciona elvisQuotaMensal pro gate da IA.
 *
 * Slugs estáveis usados pelo código:
 *   - "gratuito"
 *   - "pro"
 *   - "whallet-plus"
 */
@Entity
@Table(name = "planos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plano {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 50, unique = true)
    private String nome;

    /**
     * Identificador estável usado pelo código.
     * Ex: "whallet-plus", "pro", "gratuito"
     */
    @Column(nullable = false, length = 50, unique = true)
    private String slug;

    @Column(length = 200)
    private String descricao;

    @Column(name = "limite_mensal", nullable = false)
    @Builder.Default
    private Integer limiteMensal = 8;

    @Column(name = "preco_mensal", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal precoMensal = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    /**
     * Limite mensal de perguntas ao Elvis (IA do CNAB).
     * Adicionado em V28 (Sprint A3.9).
     *
     * Valores:
     *   - NULL    = ilimitado (Whallet+)
     *   - INTEGER = limite mensal (Free: 5)
     */
    @Column(name = "elvis_quota_mensal")
    private Integer elvisQuotaMensal;

    /**
     * Helper: indica se este plano tem uso ilimitado do Elvis.
     */
    public boolean elvisIlimitado() {
        return elvisQuotaMensal == null;
    }
}