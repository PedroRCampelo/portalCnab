package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Orcamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrcamentoRepository extends JpaRepository<Orcamento, UUID> {

    Page<Orcamento> findByEmpresaId(UUID empresaId, Pageable pageable);

    Page<Orcamento> findByEmpresaIdAndStatus(UUID empresaId, String status, Pageable pageable);

    Page<Orcamento> findByEmpresaIdAndClienteId(UUID empresaId, UUID clienteId, Pageable pageable);

    Optional<Orcamento> findByIdAndEmpresaId(UUID id, UUID empresaId);

    List<Orcamento> findAllByEmpresaId(UUID empresaId);

    @Query(value = "SELECT NEXTVAL('orcamento_numero_seq')", nativeQuery = true)
    Long proximoNumeroSequencia();
}
