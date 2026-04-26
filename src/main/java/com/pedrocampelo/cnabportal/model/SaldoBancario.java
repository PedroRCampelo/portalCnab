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
import java.util.UUID;

/**
 * Conta bancária do MEI.
 *
 * IMPORTANTE: o campo `saldoInicial` é IMUTÁVEL após criação.
 * Para alterar saldo da conta, criar movimento bancário do tipo AJUSTE_MANUAL.
 *
 * O saldo "atual" é CALCULADO: saldoInicial + soma(movimentos não cancelados).
 */
@Entity
@Table(name = "saldos_bancarios")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SaldoBancario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // ── Identificação da conta ────────────────────────────────────────────────

    @Column(name = "nome_conta", nullable = false, length = 100)
    @NotBlank
    private String nomeConta;

    @Column(length = 50)
    private String banco;

    // ── Saldo inicial (IMUTÁVEL) ──────────────────────────────────────────────

    /**
     * Saldo inicial da conta. Imutável após criação.
     * Para ajustar saldo posteriormente, criar movimento AJUSTE_MANUAL.
     */
    @Column(name = "saldo_inicial", nullable = false, precision = 18, scale = 2, updatable = false)
    @NotNull
    @Builder.Default
    private BigDecimal saldoInicial = BigDecimal.ZERO;

    @Column(name = "data_inicial", nullable = false, updatable = false)
    @Builder.Default
    private LocalDate dataInicial = LocalDate.now();

    // ── Flags ─────────────────────────────────────────────────────────────────

    @Column(nullable = false)
    @Builder.Default
    private Boolean principal = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    // ── Auditoria ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}