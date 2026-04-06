package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.TipoGasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TipoGastoRepository extends JpaRepository<TipoGasto, UUID> {

    List<TipoGasto> findByUsuarioIdAndAtivoTrueOrderByNomeAsc(UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndUsuarioIdAndAtivoTrue(String nome, UUID usuarioId);
}