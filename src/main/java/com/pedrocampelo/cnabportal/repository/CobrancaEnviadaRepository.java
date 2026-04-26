package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.CobrancaEnviada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CobrancaEnviadaRepository extends JpaRepository<CobrancaEnviada, UUID> {

    // Histórico de cobranças de um recebimento (mais recentes primeiro)
    List<CobrancaEnviada> findByRecebimentoIdOrderByEnviadoEmDesc(UUID recebimentoId);

    // Contagem nas últimas 24h — pra evitar spam
    long countByRecebimentoIdAndEnviadoEmAfter(UUID recebimentoId, LocalDateTime depoisDe);
}