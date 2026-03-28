package com.pedrocampelo.cnabportal.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTO com todos os dados necessários para gerar o relatório PDF analítico.
 * Produzido pelo CnabAnalysisService a partir de uma List<ParsedRecord>.
 */
public record CnabReportData(

        // ── Metadados do arquivo ───────────────────────────────────────────────
        String nomeEmpresa,
        String cnpjEmpresa,
        String nomeBanco,
        String nomeArquivo,
        String tipoArquivo,       // "REMESSA" | "RETORNO"
        String modalidade,        // "PAGAMENTO" | "COBRANÇA"
        String dataGeracao,       // extraída do header do arquivo
        String dataRelatorio,     // data/hora em que o relatório foi gerado

        // ── Resumo executivo ───────────────────────────────────────────────────
        int    totalLinhas,
        int    totalTitulos,      // registros de detalhe (seg A/J/P/O/N)
        int    totalLotes,        // headers de lote (tipo 1)
        BigDecimal valorTotal,
        BigDecimal valorMedio,
        BigDecimal maiorValor,
        BigDecimal menorValor,

        // ── Distribuição ──────────────────────────────────────────────────────
        Map<String, Long>       contagemPorTipo,   // "3A"→42, "3J"→15
        Map<String, BigDecimal> valorPorTipo,      // "3A"→98450.00

        // ── Linha do tempo (mês/ano extraído de DATA_PAGTO ou VENCIMENTO) ──────
        Map<String, Integer>    titulosPorMes,     // "2024-03"→34
        Map<String, BigDecimal> valorPorMes,       // "2024-03"→54320.00

        // ── Alertas gerados pela análise ──────────────────────────────────────
        List<Alerta> alertas,

        // ── Top favorecidos ────────────────────────────────────────────────────
        List<String> topFavorecidos   // até 10 nomes mais frequentes

) {

    public record Alerta(
            Severidade severidade,
            String     categoria,
            String     descricao,
            int        quantidade,
            String     detalhe
    ) {}

    public enum Severidade {
        CRITICO,   // dado inválido / bloqueante
        ATENCAO,   // merece revisão
        INFO       // informativo / estatístico
    }
}