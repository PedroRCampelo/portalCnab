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

    Optional<MovimentoBancario> findByIdAndEmpresaId(UUID id, UUID empresaId);

    // ── Extrato (paginado, ordenado por data desc) ────────────────────────────

    /**
     * Extrato de UMA conta específica.
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
     * Extrato consolidado de TODAS as contas da empresa (sem filtros).
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
     * Extrato com filtros opcionais.
     * Filtros que vierem null são ignorados (graças aos `CAST(:param AS tipo) IS NULL OR ...`).
     *
     * Usa native query porque o PostgreSQL não consegue inferir o tipo dos parâmetros
     * em queries JPQL quando comparados com IS NULL. O cast explícito resolve.
     */
    @Query(value = """
        SELECT * FROM movimentos_bancarios m
        WHERE m.empresa_id = :empresaId
          AND (CAST(:contaId AS uuid) IS NULL OR m.conta_id = CAST(:contaId AS uuid))
          AND (CAST(:tipo AS text) IS NULL OR m.tipo = CAST(:tipo AS text))
          AND (CAST(:dataInicio AS date) IS NULL OR m.data_movimento >= CAST(:dataInicio AS date))
          AND (CAST(:dataFim AS date) IS NULL OR m.data_movimento <= CAST(:dataFim AS date))
        ORDER BY m.data_movimento DESC, m.criado_em DESC
        """,
            countQuery = """
        SELECT COUNT(*) FROM movimentos_bancarios m
        WHERE m.empresa_id = :empresaId
          AND (CAST(:contaId AS uuid) IS NULL OR m.conta_id = CAST(:contaId AS uuid))
          AND (CAST(:tipo AS text) IS NULL OR m.tipo = CAST(:tipo AS text))
          AND (CAST(:dataInicio AS date) IS NULL OR m.data_movimento >= CAST(:dataInicio AS date))
          AND (CAST(:dataFim AS date) IS NULL OR m.data_movimento <= CAST(:dataFim AS date))
        """,
            nativeQuery = true)
    Page<MovimentoBancario> extratoFiltrado(
            @Param("empresaId")  UUID empresaId,
            @Param("contaId")    UUID contaId,
            @Param("tipo")       String tipo,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim,
            Pageable pageable
    );

    /**
     * Extrato de uma conta filtrado por período (lista, sem paginação).
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

    // ── Movimentos por origem ────────────────────────────────────────────────

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