package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.ClienteSetorDado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClienteSetorDadoRepository extends JpaRepository<ClienteSetorDado, UUID> {

    List<ClienteSetorDado> findByClienteId(UUID clienteId);

    Optional<ClienteSetorDado> findByClienteIdAndCampoId(UUID clienteId, UUID campoId);

    void deleteByClienteId(UUID clienteId);
}