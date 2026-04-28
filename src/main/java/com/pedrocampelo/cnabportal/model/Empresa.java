package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade JPA que representa a tabela 'empresas'.
 *
 * Cada empresa é um tenant do sistema multi-tenant real (Sprint 2.2-A1).
 *
 * Campos MEI (Sprint 2.2):
 *   - limiteAnualMei
 *   - dasAtivo / dasCategoria / dasValorMensal
 *
 * Campos multi-tenant (Sprint 2.2-A1):
 *   - cnpj agora é NULLABLE (opcional no plano Gratuito)
 *   - criadorUsuarioId rastreia quem criou a empresa (DONO original)
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

    /**
     * CNPJ formatado: XX.XXX.XXX/XXXX-XX
     * Nullable: opcional no plano Gratuito, obrigatório ao assinar Whallet+.
     * Único quando preenchido (1 CNPJ = 1 Empresa).
     */
    @Column(unique = true, length = 18)
    private String cnpj;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativa = true;

    /**
     * Usuário que criou a empresa — vira o DONO automaticamente.
     * Pode ser null para empresas legadas (criadas antes desta migração).
     */
    @Column(name = "criador_usuario_id")
    private UUID criadorUsuarioId;

    // ── Configurações MEI (Sprint 2.2) ───────────────────────────────────────

    @Column(name = "limite_anual_mei", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal limiteAnualMei = new BigDecimal("81000.00");

    @Column(name = "das_ativo", nullable = false)
    @Builder.Default
    private Boolean dasAtivo = false;

    @Column(name = "das_categoria", length = 20)
    private String dasCategoria;

    @Column(name = "das_valor_mensal", precision = 18, scale = 2)
    private BigDecimal dasValorMensal;

    // ── Auditoria ────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @UpdateTimestamp
    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;
}