package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Recebimento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecebimentoRepository extends JpaRepository<Recebimento, UUID> {

    // Listagem por empresa
    Page<Recebimento> findByEmpresaId(UUID empresaId, Pageable pageable);

    // Filtros comuns
    Page<Recebimento> findByEmpresaIdAndStatus(UUID empresaId, String status, Pageable pageable);

    Page<Recebimento> findByEmpresaIdAndClienteId(UUID empresaId, UUID clienteId, Pageable pageable);

    // Garantia de tenant
    Optional<Recebimento> findByIdAndEmpresaId(UUID id, UUID empresaId);

    // ── Histórico do cliente ──────────────────────────────────────────────────

    List<Recebimento> findByClienteIdOrderByDataVencimentoDesc(UUID clienteId);

    // ── Queries pra dashboard / fluxo de caixa (Sprint 2) ─────────────────────

    /**
     * Soma o que está pendente (tudo que ainda não foi recebido) num período.
     * Usado pelo "vou receber esse mês" do fluxo de caixa.
     */
    @Query("""
        SELECT COALESCE(SUM(r.valor - r.valorRecebido), 0)
        FROM Recebimento r
        WHERE r.empresa.id = :empresaId
          AND r.status IN ('PENDENTE', 'PARCIAL', 'ATRASADO')
          AND r.dataVencimento BETWEEN :inicio AND :fim
    """)
    BigDecimal somarPendentesNoPeriodo(@Param("empresaId") UUID empresaId,
                                       @Param("inicio") LocalDate inicio,
                                       @Param("fim") LocalDate fim);

    /**
     * Lista recebimentos atrasados — base pra notificações e cobrança.
     */
    @Query("""
        SELECT r FROM Recebimento r
        WHERE r.empresa.id = :empresaId
          AND r.status IN ('PENDENTE', 'PARCIAL')
          AND r.dataVencimento < CURRENT_DATE
        ORDER BY r.dataVencimento
    """)
    List<Recebimento> listarAtrasados(@Param("empresaId") UUID empresaId);

    /**
     * Próximos a vencer (X dias) — usado no widget do dashboard.
     */
    @Query("""
        SELECT r FROM Recebimento r
        WHERE r.empresa.id = :empresaId
          AND r.status IN ('PENDENTE', 'PARCIAL')
          AND r.dataVencimento BETWEEN CURRENT_DATE AND :dataLimite
        ORDER BY r.dataVencimento
    """)
    List<Recebimento> listarProximosAVencer(@Param("empresaId") UUID empresaId,
                                            @Param("dataLimite") LocalDate dataLimite);

    // ── Score de cliente (calculado on-demand) ────────────────────────────────

    long countByClienteIdAndStatus(UUID clienteId, String status);

    long countByClienteId(UUID clienteId);

    // ── Sprint 2.2-B · Termômetro de faturamento ─────────────────────────────

    /**
     * Soma o valor total recebido no ano corrente (status = RECEBIDO).
     * Base pro termômetro MEI: "quanto faturei esse ano vs limite de R$ 81k".
     */
    @Query("""
        SELECT COALESCE(SUM(r.valorRecebido), 0)
        FROM Recebimento r
        WHERE r.empresa.id = :empresaId
          AND r.status = 'RECEBIDO'
          AND r.dataRecebimento BETWEEN :inicioAno AND :fimAno
    """)
    BigDecimal somarFaturadoNoAno(@Param("empresaId") UUID empresaId,
                                  @Param("inicioAno") LocalDate inicioAno,
                                  @Param("fimAno") LocalDate fimAno);

    /**
     * Conta meses distintos com recebimentos no ano (pra calcular média mensal).
     * Ex: se recebeu em jan, mar, abr → retorna 3.
     *
     * Query nativa: JPQL não suporta EXTRACT() dentro de COUNT(DISTINCT).
     */
    @Query(value =
            "SELECT COUNT(DISTINCT EXTRACT(MONTH FROM r.data_recebimento)) " +
                    "FROM recebimentos r " +
                    "WHERE r.empresa_id = :empresaId " +
                    "AND r.status = 'RECEBIDO' " +
                    "AND r.data_recebimento BETWEEN :inicioAno AND :fimAno",
            nativeQuery = true)
    int contarMesesComRecebimento(@Param("empresaId") UUID empresaId,
                                  @Param("inicioAno") LocalDate inicioAno,
                                  @Param("fimAno") LocalDate fimAno);

    /**
     * Lista todos os recebimentos da empresa ordenados por vencimento.
     * Usado pelos relatórios (sem paginação).
     */
    List<Recebimento> findByEmpresaIdOrderByDataVencimentoAsc(UUID empresaId);

    // ── Sprint F1.1 · Código legível sequencial ──────────────────────────────

    /**
     * Próximo valor da sequência de código de recebimento.
     * Garante unicidade mesmo sob concorrência (sequence do PostgreSQL).
     */
    // ── Sprint F1.1 · Número sequencial ──────────────────────────────────────
    @Query(value = "SELECT nextval('seq_recebimento_numero')", nativeQuery = true)
    Long proximoNumeroSequencia();


    @Query(value = "SELECT nextval('seq_recebimento_numero')", nativeQuery = true)
    Long proximoCodigoSequencia();
}