package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.MovimentoBancario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MovimentoBancarioRepository extends JpaRepository<MovimentoBancario, UUID> {

    // Garantia de tenant
    Optional<MovimentoBancario> findByIdAndEmpresaId(UUID id, UUID empresaId);

    // ── Extrato (paginado, ordenado por data desc) ────────────────────────────

    /**
     * Extrato de UMA conta específica, ordenado do mais recente ao mais antigo.
     */
    @Query("""
        SELECT m FROM MovimentoBancario m
        WHERE m.conta.id = :contaId
          AND m.empresa.id = :empresaId
        ORDER BY m.dataMovimento DESC, m.criadoEm DESC
    """)
    Page<MovimentoBancario> extratoPorConta(
            @Param("contaId") UUID contaId,
            @Param("empresaId") UUID empresaId,
            Pageable pageable
    );

    /**
     * Extrato consolidado de TODAS as contas da empresa.
     */
    @Query("""
        SELECT m FROM MovimentoBancario m
        WHERE m.empresa.id = :empresaId
        ORDER BY m.dataMovimento DESC, m.criadoEm DESC
    """)
    Page<MovimentoBancario> extratoConsolidado(
            @Param("empresaId") UUID empresaId,
            Pageable pageable
    );

    /**
     * Extrato de uma conta filtrado por período.
     */
    @Query("""
        SELECT m FROM MovimentoBancario m
        WHERE m.conta.id = :contaId
          AND m.empresa.id = :empresaId
          AND m.dataMovimento BETWEEN :inicio AND :fim
        ORDER BY m.dataMovimento DESC, m.criadoEm DESC
    """)
    List<MovimentoBancario> extratoPorContaNoPeriodo(
            @Param("contaId") UUID contaId,
            @Param("empresaId") UUID empresaId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim
    );

    // ── Buscar movimentos por origem (ex: "todos os movimentos do recebimento X") ──

    @Query("""
        SELECT m FROM MovimentoBancario m
        WHERE m.origemTipo = :origemTipo
          AND m.origemId = :origemId
          AND m.empresa.id = :empresaId
        ORDER BY m.criadoEm
    """)
    List<MovimentoBancario> buscarPorOrigem(
            @Param("origemTipo") String origemTipo,
            @Param("origemId") UUID origemId,
            @Param("empresaId") UUID empresaId
    );

    /**
     * Verifica se existe movimento ATIVO (não cancelado) com a origem informada.
     * Útil pra evitar duplicar movimentos.
     */
    @Query("""
        SELECT COUNT(m) > 0 FROM MovimentoBancario m
        WHERE m.origemTipo = :origemTipo
          AND m.origemId = :origemId
          AND m.cancelado = false
    """)
    boolean existeAtivoComOrigem(
            @Param("origemTipo") String origemTipo,
            @Param("origemId") UUID origemId
    );
}