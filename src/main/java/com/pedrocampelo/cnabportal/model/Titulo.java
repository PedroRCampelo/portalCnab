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
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
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

    // ── Identificação ─────────────────────────────────────────────────────────

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String prefixo = "AP";

    @Column(nullable = false, length = 20)
    @NotBlank
    private String numero;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String parcela = "001";

    // ── Tipo de pagamento ─────────────────────────────────────────────────────

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String tipo = "BOLETO";

    // ── Tipo de gasto (referência opcional por UUID) ──────────────────────────

    @Column(name = "tipo_gasto_id")
    private UUID tipoGastoId;

    // ── Fornecedor ────────────────────────────────────────────────────────────

    @Column(name = "fornecedor_nome", nullable = false, length = 150)
    @NotBlank
    private String fornecedorNome;

    @Column(name = "fornecedor_documento", length = 20)  // opcional
    private String fornecedorDocumento;

    // ── Datas ─────────────────────────────────────────────────────────────────

    @Column(nullable = false)
    @NotNull
    private LocalDate emissao;

    @Column(nullable = false)
    @NotNull
    private LocalDate vencimento;

    @Column(name = "data_baixa")
    private LocalDate dataBaixa;

    // ── Valores ───────────────────────────────────────────────────────────────

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

    // ── Outros ────────────────────────────────────────────────────────────────

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String status = "PENDENTE";

    // ── Integração Protheus/CNAB ──────────────────────────────────────────────

    @Column(name = "numero_bordero", length = 20)
    private String numeroBordero;

    @Column(name = "id_cnab", length = 50)
    private String idCnab;

    @Column(name = "codigo_barras", length = 50)
    private String codigoBarras;

    @Column(name = "linha_digitavel", length = 100)
    private String linhaDigitavel;

    // ── Dados bancários do favorecido — Segmento A (TED/DOC/Crédito) ─────────

    @Column(name = "favorecido_banco_code", length = 3)
    private String favorecidoBancoCode;      // ex: "341" = Itaú

    @Column(name = "favorecido_agencia", length = 5)
    private String favorecidoAgencia;

    @Column(name = "favorecido_agencia_dv", length = 1)
    private String favorecidoAgenciaDv;

    @Column(name = "favorecido_conta", length = 12)
    private String favorecidoConta;

    @Column(name = "favorecido_conta_dv", length = 1)
    private String favorecidoContaDv;

    @Column(name = "favorecido_tipo_conta", length = 2)
    private String favorecidoTipoConta;      // CC | CP | PP

    @Column(name = "favorecido_tipo_inscricao", length = 1)
    private String favorecidoTipoInscricao; // 1=CPF 2=CNPJ

    @Column(name = "finalidade_ted", length = 5)
    private String finalidadeTed;            // ex: "00001" = crédito em conta

    @Column(name = "finalidade_doc", length = 2)
    private String finalidadeDoc;

    @Column(name = "aviso", length = 1)
    @Builder.Default
    private String aviso = "0";              // 0=não avisar 2=avisar favorecido

    // ── PIX ───────────────────────────────────────────────────────────────────

    @Column(name = "tipo_chave_pix", length = 10)
    private String tipoChavePix;             // CPF | CNPJ | EMAIL | TELEFONE | EVP

    @Column(name = "chave_pix", length = 99)
    private String chavePix;

    // ── Endereço do favorecido — Segmento B (alguns bancos) ──────────────────

    @Column(name = "favorecido_logradouro", length = 40)
    private String favorecidoLogradouro;

    @Column(name = "favorecido_cidade", length = 15)
    private String favorecidoCidade;

    @Column(name = "favorecido_estado", length = 2)
    private String favorecidoEstado;

    @Column(name = "favorecido_cep", length = 8)
    private String favorecidoCep;

    // ── Controle CNAB ─────────────────────────────────────────────────────────

    @Column(name = "seu_numero", length = 20)
    private String seuNumero;               // referência do pagador no lote

    @Column(name = "nosso_numero", length = 20)
    private String nossoNumero;             // retorno do banco

    // ── Auditoria ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    // ── Utilitário ────────────────────────────────────────────────────────────

    public void atualizarStatus() {
        if ("PAGO".equals(this.status)) return;
        if (this.vencimento != null && this.vencimento.isBefore(LocalDate.now())) {
            this.status = "VENCIDO";
        } else {
            this.status = "PENDENTE";
        }
    }
}