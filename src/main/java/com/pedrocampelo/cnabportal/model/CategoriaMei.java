package com.pedrocampelo.cnabportal.model;

import java.math.BigDecimal;

/**
 * Categoria MEI — define o valor padrão do DAS mensal.
 *
 * Aplicável apenas quando regime_tributario = MEI.
 *
 * Valores DAS (referência 2025/2026):
 *   - COMERCIO_INDUSTRIA → R$ 76,90 (paga ICMS)
 *   - SERVICOS           → R$ 80,90 (paga ISS)
 *   - AMBOS              → R$ 81,90 (paga ICMS + ISS)
 */
public enum CategoriaMei {

    COMERCIO_INDUSTRIA(new BigDecimal("76.90"), "Comércio / Indústria", "Paga ICMS"),
    SERVICOS         (new BigDecimal("80.90"), "Serviços",                "Paga ISS"),
    AMBOS            (new BigDecimal("81.90"), "Comércio + Serviços",     "Paga ICMS + ISS");

    private final BigDecimal valorDasPadrao;
    private final String     descricaoCurta;
    private final String     descricaoTributo;

    CategoriaMei(BigDecimal valorDasPadrao, String descricaoCurta, String descricaoTributo) {
        this.valorDasPadrao   = valorDasPadrao;
        this.descricaoCurta   = descricaoCurta;
        this.descricaoTributo = descricaoTributo;
    }

    public BigDecimal getValorDasPadrao()    { return valorDasPadrao; }
    public String     getDescricaoCurta()    { return descricaoCurta; }
    public String     getDescricaoTributo()  { return descricaoTributo; }
}