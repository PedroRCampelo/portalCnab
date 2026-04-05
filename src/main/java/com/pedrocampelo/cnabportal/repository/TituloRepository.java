package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Titulo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
            @Param("status")    String status,
            @Param("busca")     String busca,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(t.saldo), 0) FROM Titulo t WHERE t.usuario.id = :usuarioId AND t.status != 'PAGO'")
    BigDecimal totalSaldoAberto(@Param("usuarioId") UUID usuarioId);

    @Query("SELECT COUNT(t) FROM Titulo t WHERE t.usuario.id = :usuarioId AND t.status = :status")
    long countByStatus(@Param("usuarioId") UUID usuarioId, @Param("status") String status);

    boolean existsByUsuarioIdAndNumeroAndParcela(UUID usuarioId, String numero, String parcela);
}