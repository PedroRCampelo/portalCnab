package com.pedrocampelo.cnabportal.dto;

import java.math.BigDecimal;

/**
 * Resposta do endpoint GET /api/empresa/termometro-faturamento
 * Sprint 2.2-B · Termômetro de faturamento MEI
 *
 * Exemplo de resposta:
 *   {
 *     "regime": "MEI",
 *     "ano": 2026,
 *     "limiteAnual": 81000.00,
 *     "faturadoNoAno": 54300.00,
 *     "percentual": 67.0,
 *     "restante": 26700.00,
 *     "mediaMensal": 13575.00,
 *     "projecaoAnual": 162900.00,
 *     "mesesComReceita": 4,
 *     "mesEstouro": "2026-07",
 *     "alerta": "ATENCAO",
 *     "mensagem": "No ritmo atual, você atinge o limite MEI em julho/2026"
 *   }
 *
 * Alertas:
 *   TRANQUILO  → percentual < 60%
 *   ATENCAO    → percentual >= 60% e < 80%
 *   CRITICO    → percentual >= 80% e < 100%
 *   ESTOURADO  → percentual >= 100%
 *   SEM_LIMITE → empresa sem limite cadastrado
 *   SEM_DADOS  → sem recebimentos no ano
 */
public record TermometroFaturamentoResponse(
        String     regime,
        int        ano,
        BigDecimal limiteAnual,
        BigDecimal faturadoNoAno,
        double     percentual,
        BigDecimal restante,
        BigDecimal mediaMensal,
        BigDecimal projecaoAnual,
        int        mesesComReceita,
        String     mesEstouro,       // formato "YYYY-MM" ou null se não vai estourar
        String     alerta,
        String     mensagem
) {}