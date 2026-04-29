package com.pedrocampelo.cnabportal.model;

/**
 * Regime tributário da empresa.
 *
 * Sprint 2.2-A1.5: refatoração para suportar diferentes regimes brasileiros.
 *
 * Hierarquia conceitual:
 *   - NENHUM            → Pessoa física com CNPJ (autônomo) ou empresa sem regime definido
 *   - MEI               → Microempreendedor Individual (até R$ 81k/ano, DAS fixo)
 *   - SIMPLES_NACIONAL  → ME (até R$ 360k) ou EPP (até R$ 4.8M), DAS percentual
 *   - LUCRO_PRESUMIDO   → Empresas com faturamento até R$ 78M, regime simplificado de IR
 *   - LUCRO_REAL        → Empresas grandes ou setores específicos (bancos, etc)
 *   - OUTRO             → Casos exóticos (cooperativas, MEI Caminhoneiro especial, etc)
 *
 * Implementado nessa fase: NENHUM e MEI.
 * Demais regimes ficam preparados pra implementação futura (UI já tem placeholder).
 */
public enum RegimeTributario {
    NENHUM,
    MEI,
    SIMPLES_NACIONAL,
    LUCRO_PRESUMIDO,
    LUCRO_REAL,
    OUTRO
}