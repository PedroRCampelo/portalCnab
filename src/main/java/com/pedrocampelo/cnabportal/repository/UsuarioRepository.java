// ─────────────────────────────────────────────────────────────────────────────
// UsuarioRepository.java
// Coloque em: src/main/java/com/pedrocampelo/cnabportal/repository/
// ─────────────────────────────────────────────────────────────────────────────

package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    // Busca por email — usado no login e no UserDetailsService
    Optional<Usuario> findByEmail(String email);

    // Verifica se email já existe — usado no cadastro para evitar duplicatas
    boolean existsByEmail(String email);

    // Busca apenas usuários ativos por email
    // (usuários desativados não devem conseguir logar)
    Optional<Usuario> findByEmailAndAtivoTrue(String email);

    // Atualiza o último acesso após login bem-sucedido
    // @Modifying + @Transactional necessários para queries de escrita
    @Modifying
    @Transactional
    @Query("UPDATE Usuario u SET u.ultimoAcesso = :agora WHERE u.id = :id")
    void atualizarUltimoAcesso(UUID id, LocalDateTime agora);
}


// ─────────────────────────────────────────────────────────────────────────────
// EmpresaRepository.java
// Coloque em: src/main/java/com/pedrocampelo/cnabportal/repository/
// ─────────────────────────────────────────────────────────────────────────────

// package com.pedrocampelo.cnabportal.repository;
//
// import com.pedrocampelo.cnabportal.model.Empresa;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.stereotype.Repository;
//
// import java.util.Optional;
// import java.util.UUID;
//
// @Repository
// public interface EmpresaRepository extends JpaRepository<Empresa, UUID> {
//
//     Optional<Empresa> findByCnpj(String cnpj);
//     boolean existsByCnpj(String cnpj);
// }