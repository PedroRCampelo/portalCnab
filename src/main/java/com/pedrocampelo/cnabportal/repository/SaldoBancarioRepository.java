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
     * Calcula o saldo atual de UMA conta = saldo_inicial + soma(movimentos não cancelados).
     *
     * Query usa CASE pra somar/subtrair conforme eh_entrada.
     * COALESCE garante zero quando não há movimentos.
     */
    @Query("""
        SELECT COALESCE(s.saldoInicial, 0) +
               COALESCE(SUM(CASE WHEN m.ehEntrada = true THEN m.valor ELSE -m.valor END), 0)
        FROM SaldoBancario s
        LEFT JOIN MovimentoBancario m
            ON m.conta.id = s.id AND m.cancelado = false
        WHERE s.id = :contaId
        GROUP BY s.id, s.saldoInicial
    """)
    Optional<BigDecimal> calcularSaldoAtual(@Param("contaId") UUID contaId);

    /**
     * Calcula a soma dos saldos atuais de TODAS as contas ativas da empresa.
     * Usado pelo Fluxo de Caixa para o "Saldo total".
     */
    @Query("""
        SELECT COALESCE(SUM(s.saldoInicial), 0) +
               COALESCE(SUM(CASE WHEN m.ehEntrada = true THEN m.valor ELSE -m.valor END), 0)
        FROM SaldoBancario s
        LEFT JOIN MovimentoBancario m
            ON m.conta.id = s.id AND m.cancelado = false
        WHERE s.empresa.id = :empresaId AND s.ativo = true
    """)
    BigDecimal somarSaldosAtivos(@Param("empresaId") UUID empresaId);
}