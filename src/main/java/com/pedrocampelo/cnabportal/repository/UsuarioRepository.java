package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByEmailAndAtivoTrue(String email);
    Optional<Usuario> findByStripeSubscriptionId(String stripeSubscriptionId);
    Optional<Usuario> findByTokenVerificacao(String token);
    Optional<Usuario> findByTokenRedefinicao(String token);

    // Busca usuário pelo ID permanente da conta Google (claim 'sub' do ID Token)
    Optional<Usuario> findByGoogleId(String googleId);

    // Busca usuários que querem receber algum tipo de alerta e têm e-mail verificado
    @org.springframework.data.jpa.repository.Query(
            "SELECT u FROM Usuario u WHERE u.emailVerificado = true AND u.ativo = true " +
                    "AND (u.alertaVencidos = true OR u.alertaAVencer = true)"
    )
    java.util.List<Usuario> findUsuariosComAlertaAtivo();
    boolean existsByEmail(String email);

    @Modifying
    @Transactional
    @Query("UPDATE Usuario u SET u.ultimoAcesso = :agora WHERE u.id = :id")
    void atualizarUltimoAcesso(UUID id, LocalDateTime agora);

    // Sprint Trial: busca trials expirados pra batch de expiração
    List<Usuario> findByAssinaturaStatusAndTrialExpiraEmBefore(String status, OffsetDateTime antes);
}