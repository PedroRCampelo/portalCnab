package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.NumeradorEmpresa;
import com.pedrocampelo.cnabportal.model.NumeradorEmpresaId;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface NumeradorEmpresaRepository extends JpaRepository<NumeradorEmpresa, NumeradorEmpresaId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT n FROM NumeradorEmpresa n WHERE n.empresaId = :empresaId AND n.tipo = :tipo")
    Optional<NumeradorEmpresa> findByEmpresaIdAndTipoWithLock(
            @Param("empresaId") UUID empresaId,
            @Param("tipo") String tipo);
}
