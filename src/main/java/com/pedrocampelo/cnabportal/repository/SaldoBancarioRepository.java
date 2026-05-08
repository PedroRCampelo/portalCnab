package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.SaldoBancario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaldoBancarioRepository extends JpaRepository<SaldoBancario, UUID> {

    @Query("""
        SELECT s FROM SaldoBancario s
        WHERE s.empresa.id = :empresaId AND s.ativo = true
        ORDER BY s.principal DESC, s.nomeConta ASC
    """)
    List<SaldoBancario> listarAtivas(@Param("empresaId") UUID empresaId);

    Optional<SaldoBancario> findByIdAndEmpresaId(UUID id, UUID empresaId);

    Optional<SaldoBancario> findByEmpresaIdAndPrincipalTrueAndAtivoTrue(UUID empresaId);

    long countByEmpresaIdAndAtivoTrue(UUID empresaId);

    /**
     * Calcula o saldo atual de UMA conta = saldoInicial + soma(movimentos não cancelados).
     *
     * IMPORTANTE: foi dividido em 2 queries (saldoInicial e somaMovimentos) e somado
     * em código (no Service) para evitar bug clássico de JOIN+SUM:
     *   - LEFT JOIN com movimentos cria N linhas (1 por movimento)
     *   - SUM(s.saldoInicial) acabava sendo somado N vezes (duplicação)
     *
     * Aqui a query retorna SÓ a soma dos movimentos. O service soma com
     * saldoInicial da entidade.
     */
    @Query("""
        SELECT COALESCE(SUM(CASE WHEN m.ehEntrada = true THEN m.valor ELSE -m.valor END), 0)
        FROM MovimentoBancario m
        WHERE m.conta.id = :contaId AND m.cancelado = false
    """)
    BigDecimal somarMovimentosDaConta(@Param("contaId") UUID contaId);

    /**
     * Soma o saldoInicial de todas as contas ativas da empresa (sem JOIN com movimentos).
     */
    @Query("""
        SELECT COALESCE(SUM(s.saldoInicial), 0)
        FROM SaldoBancario s
        WHERE s.empresa.id = :empresaId AND s.ativo = true
    """)
    BigDecimal somarSaldosIniciaisAtivos(@Param("empresaId") UUID empresaId);

    /**
     * Soma todos os movimentos não cancelados das contas ativas da empresa.
     * Query separada (sem JOIN com saldos_bancarios além do necessário).
     */
    @Query("""
        SELECT COALESCE(SUM(CASE WHEN m.ehEntrada = true THEN m.valor ELSE -m.valor END), 0)
        FROM MovimentoBancario m
        WHERE m.empresa.id = :empresaId
          AND m.cancelado = false
          AND m.conta.ativo = true
    """)
    BigDecimal somarMovimentosDaEmpresa(@Param("empresaId") UUID empresaId);
}