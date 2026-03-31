package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Entidade JPA que representa a tabela 'usuarios'.
 *
 * Implementa UserDetails do Spring Security para que o Spring
 * consiga usar esta classe diretamente na autenticação.
 *
 * Por que implementar UserDetails aqui?
 *   Evita uma camada extra de mapeamento. A entidade já é o "usuário"
 *   que o Spring Security entende — menos código, menos pontos de falha.
 */
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

    // Relacionamento com empresa — carregado apenas quando necessário (LAZY)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 100)
    private String nome;

    // Email é o identificador de login — único no banco
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // NUNCA armazenar senha em texto puro — apenas o hash BCrypt
    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PerfilUsuario perfil = PerfilUsuario.OPERADOR;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

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

    // ── Implementação UserDetails (Spring Security) ───────────────────────────

    /**
     * Retorna as autoridades (roles) do usuário.
     * O prefixo ROLE_ é exigido pelo Spring Security para @PreAuthorize("hasRole(...)")
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + perfil.name()));
    }

    /**
     * Spring Security chama getPassword() — mapeamos para senhaHash.
     */
    @Override
    public String getPassword() {
        return senhaHash;
    }

    /**
     * Spring Security usa getUsername() como identificador único.
     * Usamos o email como identificador de login.
     */
    @Override
    public String getUsername() {
        return email;
    }

    /**
     * Conta expirada — não implementamos expiração de conta no MVP.
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Conta bloqueada — usamos o campo 'ativo' para isso.
     */
    @Override
    public boolean isAccountNonLocked() {
        return Boolean.TRUE.equals(ativo);
    }

    /**
     * Credenciais expiradas — não implementamos rotação de senha no MVP.
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Usuário habilitado — mapeado para o campo 'ativo'.
     */
    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(ativo);
    }
}