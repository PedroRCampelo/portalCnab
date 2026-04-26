package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    // Listagem padrão por empresa (multi-tenant)
    Page<Cliente> findByEmpresaIdAndAtivoTrue(UUID empresaId, Pageable pageable);

    List<Cliente> findByEmpresaIdAndAtivoTrueOrderByNomeAsc(UUID empresaId);

    // Busca por documento (evita duplicar cliente)
    Optional<Cliente> findByEmpresaIdAndDocumento(UUID empresaId, String documento);

    // Busca por nome (case-insensitive) — autocomplete na criação de recebimento
    @Query("""
        SELECT c FROM Cliente c
        WHERE c.empresa.id = :empresaId
          AND c.ativo = true
          AND LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%'))
        ORDER BY c.nome
    """)
    List<Cliente> buscarPorNome(@Param("empresaId") UUID empresaId,
                                @Param("termo") String termo);

    // Garante que cliente pertence à empresa antes de qualquer operação
    Optional<Cliente> findByIdAndEmpresaId(UUID id, UUID empresaId);

    // Total de clientes ativos (pra dashboard)
    long countByEmpresaIdAndAtivoTrue(UUID empresaId);
}