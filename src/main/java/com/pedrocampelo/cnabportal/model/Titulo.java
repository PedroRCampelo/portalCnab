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
    private String numero;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String parcela = "001";

    @Column(name = "parcela_atual")
    @Builder.Default
    private Integer parcelaAtual = 1;

    @Column(name = "parcela_total")
    @Builder.Default
    private Integer parcelaTotal = 1;

    /** Chave composta: numero + parcela (ex: AP0000101) */
    @Column(length = 30)
    private String chave;

    public void montarChave() {
        if (this.numero != null && this.parcela != null) {
            this.chave = this.numero + this.parcela;
        }
    }

    // ── Tipo de pagamento ─────────────────────────────────────────────────────

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String tipo = "BOLETO";

    // ── Tipo de gasto (legado — deprecado, usar categoriaId) ───────────────

    @Column(name = "tipo_gasto_id")
    private UUID tipoGastoId;

    /**
     * FK para tabela categorias (Sprint F1.2).
     * Substitui tipoGastoId. Na migration V32, categoria_id foi populado
     * a partir de tipo_gasto_id pra títulos existentes.
     */
    @Column(name = "categoria_id")
    private UUID categoriaId;

    /** Canal de criação: MANUAL, WHATSAPP, IMPORTACAO, API */
    @Column(name = "origem", nullable = false, length = 20)
    @Builder.Default
    private String origem = "MANUAL";

    // ── Fornecedor ────────────────────────────────────────────────────────────

    @Column(name = "fornecedor_nome", nullable = false, length = 150)
    @NotBlank
    private String fornecedorNome;

    @Column(name = "fornecedor_documento", length = 20)
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

    @Column(name = "tipo_especial", length = 20)
    private String tipoEspecial;

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
    private String favorecidoBancoCode;

    @Column(name = "favorecido_agencia", length = 5)
    private String favorecidoAgencia;

    @Column(name = "favorecido_agencia_dv", length = 1)
    private String favorecidoAgenciaDv;

    @Column(name = "favorecido_conta", length = 12)
    private String favorecidoConta;

    @Column(name = "favorecido_conta_dv", length = 1)
    private String favorecidoContaDv;

    @Column(name = "favorecido_tipo_conta", length = 2)
    private String favorecidoTipoConta;

    @Column(name = "favorecido_tipo_inscricao", length = 1)
    private String favorecidoTipoInscricao;

    @Column(name = "finalidade_ted", length = 5)
    private String finalidadeTed;

    @Column(name = "finalidade_doc", length = 2)
    private String finalidadeDoc;

    @Column(name = "aviso", length = 1)
    @Builder.Default
    private String aviso = "0";

    // ── PIX ───────────────────────────────────────────────────────────────────

    @Column(name = "tipo_chave_pix", length = 10)
    private String tipoChavePix;

    @Column(name = "chave_pix", length = 99)
    private String chavePix;

    // ── Endereço do favorecido — Segmento B ──────────────────────────────────

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
    private String seuNumero;

    @Column(name = "nosso_numero", length = 20)
    private String nossoNumero;

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