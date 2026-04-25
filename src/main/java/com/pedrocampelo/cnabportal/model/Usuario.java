package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // nullable: usuários autenticados via OAuth (Google) não têm senha local
    @Column(name = "senha_hash", length = 255)
    private String senhaHash;

    // ── Provedor de autenticação ──────────────────────────────────────────────

    @Column(name = "google_id", unique = true, length = 100)
    private String googleId;  // 'sub' do ID Token do Google — identificador permanente

    @Column(name = "provedor_auth", nullable = false, length = 20)
    @Builder.Default
    private String provedorAuth = "LOCAL";  // LOCAL | GOOGLE

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;  // URL do avatar (vem do Google)

    // ──────────────────────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PerfilUsuario perfil = PerfilUsuario.OPERADOR;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    // Verificacao de email
    @Column(name = "email_verificado", nullable = false)
    @Builder.Default
    private Boolean emailVerificado = false;

    @Column(name = "token_verificacao", length = 255)
    private String tokenVerificacao;

    @Column(name = "token_expiracao")
    private LocalDateTime tokenExpiracao;

    // Redefinição de senha
    @Column(name = "token_redefinicao", length = 255)
    private String tokenRedefinicao;

    @Column(name = "token_redefinicao_expiracao")
    private LocalDateTime tokenRedefinicaoExpiracao;

    // Controle de uso mensal
    @Column(name = "usos_mes_atual", nullable = false)
    @Builder.Default
    private Integer usosMesAtual = 0;

    @Column(name = "mes_referencia", length = 7)
    private String mesReferencia;  // formato: '2026-04'

    @Column(name = "plano_id")
    private java.util.UUID planoId;

    // ── Controle de assinatura ────────────────────────────────────────────────

    // SEM_ASSINATURA | ATIVA | CANCELANDO | EXPIRADA
    @Column(name = "assinatura_status", length = 20)
    @Builder.Default
    private String assinaturaStatus = "SEM_ASSINATURA";

    // Data em que o acesso expira (preenchida ao cancelar ou ao receber webhook)
    @Column(name = "assinatura_expira_em")
    private LocalDate assinaturaExpiraEm;

    // IDs do Stripe para não precisar buscar por e-mail em webhooks
    @Column(name = "stripe_subscription_id", length = 100)
    private String stripeSubscriptionId;

    @Column(name = "stripe_customer_id", length = 100)
    private String stripeCustomerId;

    @Column(name = "telefone", length = 20)
    private String telefone;

    // ── Preferências de alertas de e-mail ─────────────────────────────────────

    @Column(name = "alerta_vencidos", nullable = false)
    @Builder.Default
    private Boolean alertaVencidos = false;     // receber e-mail sobre títulos já vencidos

    @Column(name = "alerta_a_vencer", nullable = false)
    @Builder.Default
    private Boolean alertaAVencer = false;      // receber e-mail sobre títulos a vencer

    @Column(name = "alerta_dias_antes")
    @Builder.Default
    private Integer alertaDiasAntes = 3;        // quantos dias antes do vencimento alertar

    @Column(name = "alerta_ultimo_envio")
    private LocalDate alertaUltimoEnvio;        // data do último envio (evita duplicatas)

    // ── Insight de IA ────────────────────────────────────────────────────────

    // ── Cache de insights por bot ─────────────────────────────────────────────

    @Column(name = "insight_aurora_texto", columnDefinition = "TEXT")
    private String insightAuroraTexto;

    @Column(name = "insight_aurora_gerado_em")
    private LocalDate insightAuroraGeradoEm;

    @Column(name = "insight_frank_texto", columnDefinition = "TEXT")
    private String insightFrankTexto;

    @Column(name = "insight_frank_gerado_em")
    private LocalDate insightFrankGeradoEm;

    @Column(name = "insight_anne_texto", columnDefinition = "TEXT")
    private String insightAnneTexto;

    @Column(name = "insight_anne_gerado_em")
    private LocalDate insightAnneGeradoEm;

    // Versão global — incrementa a cada novo insight gerado por qualquer bot
    @Column(name = "insight_versao")
    @Builder.Default
    private Integer insightVersao = 0;

    // Legado — mantido para não quebrar migrações anteriores
    @Column(name = "insight_texto", columnDefinition = "TEXT")
    private String insightTexto;

    @Column(name = "insight_gerado_em")
    private LocalDate insightGeradoEm;

    @Column(name = "insight_bot", length = 10)
    @Builder.Default
    private String insightBot = "aurora";

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @Column(name = "ultimo_acesso")
    private LocalDateTime ultimoAcesso;

    // ── Enum de perfis ────────────────────────────────────────────────────────

    public enum PerfilUsuario {
        ADMIN,
        OPERADOR,
        VISUALIZADOR
    }

    // ── UserDetails (Spring Security) ─────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + perfil.name()));
    }

    @Override
    public String getPassword() {
        // Retorna string vazia se for usuário OAuth (sem senha local).
        // O DaoAuthenticationProvider só chama esse método no fluxo de login
        // por senha; no fluxo Google ele não é usado.
        return senhaHash != null ? senhaHash : "";
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return Boolean.TRUE.equals(ativo); }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return Boolean.TRUE.equals(ativo); }
}