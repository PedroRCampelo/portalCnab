package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Titulo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface TituloRepository extends JpaRepository<Titulo, UUID> {

    // Native query para evitar o erro lower(bytea) do Hibernate com parâmetros nulos
    // O cast ::text força o PostgreSQL a tratar o parâmetro como texto
    @Query(value = """
        SELECT * FROM titulos t
        WHERE t.usuario_id = :usuarioId
          AND (CAST(:status AS text) IS NULL OR t.status = CAST(:status AS text))
          AND (CAST(:busca AS text) IS NULL
               OR LOWER(t.fornecedor_nome) LIKE LOWER(CONCAT('%', CAST(:busca AS text), '%'))
               OR t.numero LIKE CONCAT('%', CAST(:busca AS text), '%')
               OR t.fornecedor_documento LIKE CONCAT('%', CAST(:busca AS text), '%'))
        ORDER BY t.vencimento ASC, t.criado_em DESC
        """,
            countQuery = """
        SELECT COUNT(*) FROM titulos t
        WHERE t.usuario_id = :usuarioId
          AND (CAST(:status AS text) IS NULL OR t.status = CAST(:status AS text))
          AND (CAST(:busca AS text) IS NULL
               OR LOWER(t.fornecedor_nome) LIKE LOWER(CONCAT('%', CAST(:busca AS text), '%'))
               OR t.numero LIKE CONCAT('%', CAST(:busca AS text), '%')
               OR t.fornecedor_documento LIKE CONCAT('%', CAST(:busca AS text), '%'))
        """,
            nativeQuery = true)
    Page<Titulo> findByUsuarioIdComFiltros(
            @Param("usuarioId") UUID usuarioId,
            @Param("status") String status,
            @Param("busca") String busca,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(t.saldo), 0) FROM Titulo t WHERE t.usuario.id = :usuarioId AND t.status != 'PAGO'")
    BigDecimal totalSaldoAberto(@Param("usuarioId") UUID usuarioId);

    @Query("SELECT COUNT(t) FROM Titulo t WHERE t.usuario.id = :usuarioId AND t.status = :status")
    long countByStatus(@Param("usuarioId") UUID usuarioId, @Param("status") String status);

    boolean existsByUsuarioIdAndNumeroAndParcela(UUID usuarioId, String numero, String parcela);

    // Atualiza em massa: PENDENTE → VENCIDO para todos cujo vencimento já passou
    @Modifying
    @Transactional
    @Query("UPDATE Titulo t SET t.status = 'VENCIDO' WHERE t.status = 'PENDENTE' AND t.vencimento < CURRENT_DATE")
    int atualizarVencidos();

    // Fluxo de caixa: soma de saldo por mês/ano de vencimento (só em aberto)
    @Query(value = """
        SELECT TO_CHAR(t.vencimento, 'YYYY-MM') AS mes,
               SUM(t.saldo) AS total,
               COUNT(*) AS quantidade
        FROM titulos t
        WHERE t.usuario_id = :usuarioId
          AND t.status != 'PAGO'
          AND t.vencimento BETWEEN :inicio AND :fim
        GROUP BY TO_CHAR(t.vencimento, 'YYYY-MM')
        ORDER BY mes
        """, nativeQuery = true)
    List<Object[]> fluxoCaixaMensal(
            @Param("usuarioId") UUID usuarioId,
            @Param("inicio") java.time.LocalDate inicio,
            @Param("fim") java.time.LocalDate fim
    );

    // Por tipo de gasto: soma de saldo agrupada por tipo_gasto_id
    @Query(value = """
        SELECT COALESCE(tg.nome, 'Sem categoria') AS categoria,
               SUM(t.saldo) AS total,
               COUNT(*) AS quantidade
        FROM titulos t
        LEFT JOIN tipos_gasto tg ON tg.id = t.tipo_gasto_id
        WHERE t.usuario_id = :usuarioId
          AND t.status != 'PAGO'
        GROUP BY COALESCE(tg.nome, 'Sem categoria')
        ORDER BY total DESC
        """, nativeQuery = true)
    List<Object[]> porTipoGasto(@Param("usuarioId") UUID usuarioId);

    // Top fornecedores: soma de saldo por fornecedor
    @Query(value = """
        SELECT t.fornecedor_nome AS fornecedor,
               SUM(t.saldo) AS total,
               COUNT(*) AS quantidade
        FROM titulos t
        WHERE t.usuario_id = :usuarioId
          AND t.status != 'PAGO'
        GROUP BY t.fornecedor_nome
        ORDER BY total DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> topFornecedores(@Param("usuarioId") UUID usuarioId);

    // Aging: títulos vencidos agrupados por faixas de dias
    @Query(value = """
        SELECT
          CASE
            WHEN CURRENT_DATE - t.vencimento <= 30 THEN '0-30'
            WHEN CURRENT_DATE - t.vencimento <= 60 THEN '31-60'
            WHEN CURRENT_DATE - t.vencimento <= 90 THEN '61-90'
            ELSE '+90'
          END AS faixa,
          SUM(t.saldo) AS total,
          COUNT(*) AS quantidade
        FROM titulos t
        WHERE t.usuario_id = :usuarioId
          AND t.status = 'VENCIDO'
        GROUP BY faixa
        ORDER BY MIN(CURRENT_DATE - t.vencimento)
        """, nativeQuery = true)
    List<Object[]> aging(@Param("usuarioId") UUID usuarioId);
}