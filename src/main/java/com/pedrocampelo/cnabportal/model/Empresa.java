package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa a tabela 'empresas'.
 *
 * Sprint 2.2-A1.5: refatoração para suportar regime tributário escalável.
 *
 * Estrutura:
 *   - regimeTributario: define quais sub-campos fazem sentido
 *   - limiteFaturamentoAnual: aplicável a todos os regimes
 *   - meiCategoria/meiValorDasMensal: específicos de MEI
 *   - dasAtivo: toggle independente (qualquer regime pode ter DAS no futuro)
 *
 * Multi-tenant (Sprint 2.2-A1):
 *   - cnpj nullable (opcional pra pessoa física)
 *   - criadorUsuarioId rastreia o DONO original
 */
@Entity
@Table(name = "empresas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(unique = true, length = 18)
    private String cnpj;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativa = true;

    @Column(name = "criador_usuario_id")
    private UUID criadorUsuarioId;

    // ── Regime tributário (Sprint 2.2-A1.5) ──────────────────────────────────

    /**
     * Regime tributário da empresa.
     * Default: NENHUM (pessoa física com CNPJ, ou empresa sem regime definido).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "regime_tributario", nullable = false, length = 20)
    @Builder.Default
    private RegimeTributario regimeTributario = RegimeTributario.NENHUM;

    /**
     * Limite anual de faturamento aplicável ao regime.
     * MEI=81.000, ME=360.000, EPP=4.800.000, etc.
     * Null se regime=NENHUM ou regime sem limite definido.
     */
    @Column(name = "limite_faturamento_anual", precision = 18, scale = 2)
    private BigDecimal limiteFaturamentoAnual;

    // ── Sub-campos MEI (só aplicáveis se regime=MEI) ─────────────────────────

    /**
     * Categoria MEI: COMERCIO_INDUSTRIA, SERVICOS, AMBOS.
     * Define o valor padrão do DAS.
     * Só preenchido se regime=MEI.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "mei_categoria", length = 20)
    private CategoriaMei meiCategoria;

    /**
     * Override manual do valor mensal do DAS MEI.
     * Null usa o valor padrão da categoria.
     * Só preenchido se regime=MEI.
     */
    @Column(name = "mei_valor_das_mensal", precision = 18, scale = 2)
    private BigDecimal meiValorDasMensal;

    // ── DAS (independente do regime — qualquer regime pode ativar futuramente) ──

    /**
     * Empresa ativou o controle de DAS no Whallet.
     * Hoje só implementado pra MEI; futuramente expandido pra Simples Nacional.
     */
    @Column(name = "das_ativo", nullable = false)
    @Builder.Default
    private Boolean dasAtivo = false;

    // ── Identidade / contato ──────────────────────────────────────────────────

    @Column(name = "logo_base64", columnDefinition = "TEXT")
    private String logoBase64;

    @Column(name = "telefone", length = 20)
    private String telefone;

    @Column(name = "email_empresa", length = 150)
    private String emailEmpresa;

    // ── Auditoria ────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @UpdateTimestamp
    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;
}