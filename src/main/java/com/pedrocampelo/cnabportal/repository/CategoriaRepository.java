package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {

    /**
     * Lista categorias ativas da empresa, ordenadas por nome.
     */
    List<Categoria> findByEmpresaIdAndAtivoTrueOrderByNomeAsc(UUID empresaId);

    /**
     * Lista categorias ativas da empresa filtradas por tipo.
     * Inclui categorias do tipo especificado + tipo AMBOS.
     */
    @Query("""
        SELECT c FROM Categoria c
        WHERE c.empresa.id = :empresaId
          AND c.ativo = true
          AND (c.tipo = :tipo OR c.tipo = 'AMBOS')
        ORDER BY c.nome
    """)
    List<Categoria> findByEmpresaIdAndTipoOrderByNome(
            @Param("empresaId") UUID empresaId,
            @Param("tipo") String tipo
    );

    /**
     * Busca por ID e empresa (segurança multi-tenant).
     */
    Optional<Categoria> findByIdAndEmpresaId(UUID id, UUID empresaId);

    /**
     * Verifica duplicidade de nome por empresa e tipo.
     */
    @Query("""
        SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END
        FROM Categoria c
        WHERE c.empresa.id = :empresaId
          AND LOWER(c.nome) = LOWER(:nome)
          AND c.tipo = :tipo
          AND c.ativo = true
    """)
    boolean existsByNomeAndTipoAndEmpresa(
            @Param("empresaId") UUID empresaId,
            @Param("nome") String nome,
            @Param("tipo") String tipo
    );
}