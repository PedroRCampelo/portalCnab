package com.pedrocampelo.cnabportal.config;

import com.pedrocampelo.cnabportal.repository.TituloRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Atualiza o status dos títulos diariamente.
 *
 * Problema que resolve: títulos cadastrados como PENDENTE ficam
 * com esse status para sempre mesmo após o vencimento passar,
 * porque o status só era recalculado no momento do save.
 *
 * Solução: UPDATE em massa na madrugada. Roda todo dia às 01:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TituloStatusScheduler {

    private final TituloRepository tituloRepository;

    // Roda todo dia às 01:00 — cron: segundo minuto hora dia mês diaDaSemana
    @Scheduled(cron = "0 0 1 * * *")
    public void atualizarTitulosVencidos() {
        int atualizados = tituloRepository.atualizarVencidos();
        if (atualizados > 0) {
            log.info("StatusScheduler: {} título(s) marcado(s) como VENCIDO", atualizados);
        }
    }
}