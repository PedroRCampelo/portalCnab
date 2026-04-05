package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "titulos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Titulo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    // ── Identificação (Protheus E2) ────────────────────────────────────────────

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String prefixo = "AP";

    @Column(nullable = false, length = 20)
    @NotBlank
    private String numero;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String parcela = "001";

    // ── Tipo de pagamento ──────────────────────────────────────────────────────

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String tipo = "BOLETO"; // PIX | BOLETO | TED

    // ── Fornecedor ─────────────────────────────────────────────────────────────

    @Column(name = "fornecedor_nome", nullable = false, length = 150)
    @NotBlank
    private String fornecedorNome;

    @Column(name = "fornecedor_documento", nullable = false, length = 20)
    @NotBlank
    private String fornecedorDocumento;

    // ── Datas ──────────────────────────────────────────────────────────────────

    @Column(nullable = false)
    @NotNull
    private LocalDate emissao;

    @Column(nullable = false)
    @NotNull
    private LocalDate vencimento;

    // ── Valores ────────────────────────────────────────────────────────────────

    @Column(nullable = false, precision = 18, scale = 2)
    @NotNull
    @Positive
    private BigDecimal valor;

    @Column(nullable = false, precision = 18, scale = 2)
    @NotNull
    @PositiveOrZero
    private BigDecimal saldo;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal desconto = BigDecimal.ZERO;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal juros = BigDecimal.ZERO;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal multa = BigDecimal.ZERO;

    // ── Outros ─────────────────────────────────────────────────────────────────

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String status = "PENDENTE"; // PENDENTE | PAGO | VENCIDO

    // ── Integração futura Protheus/CNAB ────────────────────────────────────────

    @Column(name = "numero_bordero", length = 20)
    private String numeroBordero;

    @Column(name = "id_cnab", length = 50)
    private String idCnab;

    @Column(name = "codigo_barras", length = 50)
    private String codigoBarras;

    @Column(name = "linha_digitavel", length = 100)
    private String linhaDigitavel;

    // ── Auditoria ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    // ── Método utilitário: atualiza status automaticamente ────────────────────

    public void atualizarStatus() {
        if ("PAGO".equals(this.status)) return;
        if (this.vencimento != null && this.vencimento.isBefore(LocalDate.now())) {
            this.status = "VENCIDO";
        } else {
            this.status = "PENDENTE";
        }
    }
}