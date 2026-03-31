package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para a entidade Empresa.
 *
 * O Spring Data JPA gera automaticamente a implementação
 * de todos estes métodos em tempo de execução — não é necessário
 * escrever SQL ou implementar a interface manualmente.
 */
@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, UUID> {

    Optional<Empresa> findByCnpj(String cnpj);

    boolean existsByCnpj(String cnpj);
}