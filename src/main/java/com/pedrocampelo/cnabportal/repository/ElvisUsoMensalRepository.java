package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.ElvisUsoMensal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository do contador mensal do Elvis
 * Sprint A3.9.1
 *
 * Operação principal: buscar (ou criar) a linha do mês corrente do usuário.
 * Como a constraint UNIQUE(usuario_id, ano_mes) garante 1 linha por mês,
 * o reset acontece automaticamente ao virar o mês — sem job de cron.
 */
@Repository
public interface ElvisUsoMensalRepository extends JpaRepository<ElvisUsoMensal, UUID> {

    /**
     * Busca a linha do usuário no mês especificado (ex: "2026-04").
     * Retorna empty se ainda não fez nenhuma pergunta no mês.
     */
    Optional<ElvisUsoMensal> findByUsuarioIdAndAnoMes(UUID usuarioId, String anoMes);
}