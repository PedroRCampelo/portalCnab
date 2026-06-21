package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Carga;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface CargaRepository extends JpaRepository<Carga, UUID> {

    Page<Carga> findByEmpresaId(UUID empresaId, Pageable pageable);

    Page<Carga> findByEmpresaIdAndStatus(UUID empresaId, String status, Pageable pageable);

    @Query("SELECT c FROM Carga c LEFT JOIN FETCH c.pedidos p LEFT JOIN FETCH p.cliente WHERE c.id = :id AND c.empresa.id = :empresaId")
    Optional<Carga> findByIdAndEmpresaIdWithPedidos(UUID id, UUID empresaId);
}
