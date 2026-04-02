package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Remessa;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RemessaRepository extends JpaRepository<Remessa, UUID> {

    List<Remessa> findByUsuarioIdOrderByGeradoEmDesc(UUID usuarioId, PageRequest pageRequest);

    long countByUsuarioId(UUID usuarioId);
}