package com.pedrocampelo.cnabportal.layout.bradesco;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Layout Bradesco CNAB 240 — Multipag (Pagamentos), Versão 08, julho/2025.
 *
 * Banco: 237 — Bradesco
 *
 * Tipo de registro (pos 8, index 7):
 *   0 = Header de Arquivo
 *   1 = Header de Lote
 *   3 = Detalhe  →  Segmento (pos 14, index 13)
 *   5 = Trailer de Lote
 *   9 = Trailer de Arquivo
 *
 * Segmentos OBRIGATÓRIOS cobertos aqui:
 *   A — Crédito em Conta, Cheque, OP, Pagamento com Autenticação
 *   J — Pagamento de Títulos de Cobrança (boletos)
 *   O — Pagamento de Contas e Tributos com Código de Barras
 *
 * A estrutura geral do CNAB 240 Bradesco segue o padrão FEBRABAN, com campos
 * comuns nas mesmas posições que o Itaú 240. As posições aqui são 1-based.
 *
 * Nota: O Bradesco usa código de banco 237 na posição 1-3 de cada registro.
 */
public class Bradesco240PagamentoLayout {

    // ── Header de Arquivo (tipo 0) ────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_ARQUIVO = List.of(
            new BankLayoutField("0", "CODIGO_BANCO",       1,   3),   // 237
            new BankLayoutField("0", "CODIGO_LOTE",        4,   7),   // 0000
            new BankLayoutField("0", "TIPO_REGISTRO",      8,   8),   // 0
            new BankLayoutField("0", "TIPO_INSCRICAO",     18,  18),  // 1=CPF 2=CNPJ
            new BankLayoutField("0", "INSCRICAO_EMPRESA",  19,  32),
            new BankLayoutField("0", "CONVENIO",           33,  52),
            new BankLayoutField("0", "AGENCIA",            53,  57),
            new BankLayoutField("0", "CONTA",              58,  70),
            new BankLayoutField("0", "DAC",                71,  71),
            new BankLayoutField("0", "NOME_EMPRESA",       73,  102),
            new BankLayoutField("0", "NOME_BANCO",         103, 132),
            new BankLayoutField("0", "ARQUIVO_CODIGO",     143, 143), // 1=remessa 2=retorno
            new BankLayoutField("0", "DATA_GERACAO",       144, 151),
            new BankLayoutField("0", "HORA_GERACAO",       152, 157),
            new BankLayoutField("0", "NUM_SEQ_ARQUIVO",    158, 163),
            new BankLayoutField("0", "VERSAO_LAYOUT",      164, 166)
    );

    // ── Header de Lote (tipo 1) ───────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_LOTE = List.of(
            new BankLayoutField("1", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("1", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("1", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("1", "TIPO_OPERACAO",      9,   9),   // C=crédito
            new BankLayoutField("1", "TIPO_SERVICO",       10,  11),
            new BankLayoutField("1", "FORMA_PAGAMENTO",    12,  13),
            new BankLayoutField("1", "VERSAO_LOTE",        14,  16),
            new BankLayoutField("1", "TIPO_INSCRICAO",     18,  18),
            new BankLayoutField("1", "INSCRICAO_EMPRESA",  19,  32),
            new BankLayoutField("1", "CONVENIO",           33,  52),
            new BankLayoutField("1", "AGENCIA",            53,  57),
            new BankLayoutField("1", "CONTA",              58,  70),
            new BankLayoutField("1", "DAC",                71,  71),
            new BankLayoutField("1", "NOME_EMPRESA",       73,  102),
            new BankLayoutField("1", "FINALIDADE_LOTE",    103, 132),
            new BankLayoutField("1", "HISTORICO_CC",       133, 142),
            new BankLayoutField("1", "OCORRENCIAS",        231, 240)
    );

    // ── Detalhe Segmento A (tipo 3, seg A) — OBRIGATÓRIO ─────────────────
    // Crédito em Conta Corrente, Cheque, OP, Pagamento com Autenticação
    private static final List<BankLayoutField> DETALHE_A = List.of(
            new BankLayoutField("3A", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3A", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3A", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3A", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3A", "SEGMENTO",           14,  14),
            new BankLayoutField("3A", "TIPO_MOVIMENTO",     15,  15),
            new BankLayoutField("3A", "COD_INSTRUCAO",      16,  17),
            new BankLayoutField("3A", "CAMARA",             18,  20),
            new BankLayoutField("3A", "BANCO_FAVORECIDO",   21,  23),
            new BankLayoutField("3A", "AGENCIA_FAV",        24,  28),
            new BankLayoutField("3A", "DAC_AGENCIA_FAV",    29,  29),
            new BankLayoutField("3A", "CONTA_FAV",          30,  41),
            new BankLayoutField("3A", "DAC_CONTA_FAV",      42,  42),
            new BankLayoutField("3A", "DAC_AG_CONTA_FAV",   43,  43),
            new BankLayoutField("3A", "NOME_FAVORECIDO",    44,  73),
            new BankLayoutField("3A", "SEU_NUMERO",         74,  93),
            new BankLayoutField("3A", "DATA_PAGTO",         94,  101),
            new BankLayoutField("3A", "TIPO_MOEDA",         102, 104),
            new BankLayoutField("3A", "VALOR_PAGTO",        120, 134),
            new BankLayoutField("3A", "NOSSO_NUMERO",       135, 149), // retorno
            new BankLayoutField("3A", "DATA_EFETIVA",       155, 162), // retorno
            new BankLayoutField("3A", "VALOR_EFETIVO",      163, 177), // retorno
            new BankLayoutField("3A", "HISTORICO_CC",       178, 197),
            new BankLayoutField("3A", "COD_FINALIDADE",     198, 199),
            new BankLayoutField("3A", "FINALIDADE_TED",     200, 204),
            new BankLayoutField("3A", "TIPO_CONTA_FAV",     205, 207),
            new BankLayoutField("3A", "AVISO_FAVORECIDO",   230, 230),
            new BankLayoutField("3A", "OCORRENCIAS",        231, 240)
    );

    // ── Detalhe Segmento J (tipo 3, seg J) — OBRIGATÓRIO ─────────────────
    // Pagamento de Títulos de Cobrança (boletos)
    private static final List<BankLayoutField> DETALHE_J = List.of(
            new BankLayoutField("3J", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3J", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3J", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3J", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3J", "SEGMENTO",           14,  14),
            new BankLayoutField("3J", "TIPO_MOVIMENTO",     15,  15),
            new BankLayoutField("3J", "COD_INSTRUCAO",      16,  17),
            new BankLayoutField("3J", "COD_BARRAS",         18,  61),
            new BankLayoutField("3J", "NOME_CEDENTE",       62,  91),
            new BankLayoutField("3J", "DATA_VENCIMENTO",    92,  99),
            new BankLayoutField("3J", "VALOR_TITULO",       100, 114),
            new BankLayoutField("3J", "DESCONTO",           115, 129),
            new BankLayoutField("3J", "ACRESCIMO",          130, 144),
            new BankLayoutField("3J", "DATA_PAGTO",         145, 152),
            new BankLayoutField("3J", "VALOR_PAGTO",        153, 167),
            new BankLayoutField("3J", "SEU_NUMERO",         168, 187),
            new BankLayoutField("3J", "NOSSO_NUMERO",       188, 202), // retorno
            new BankLayoutField("3J", "COD_MOEDA",          203, 204),
            new BankLayoutField("3J", "DATA_CREDITO",       205, 212), // retorno
            new BankLayoutField("3J", "AVISO_FAVORECIDO",   230, 230),
            new BankLayoutField("3J", "OCORRENCIAS",        231, 240)
    );

    // ── Detalhe Segmento O (tipo 3, seg O) — OBRIGATÓRIO ─────────────────
    // Pagamento de Contas e Tributos com Código de Barras
    private static final List<BankLayoutField> DETALHE_O = List.of(
            new BankLayoutField("3O", "CODIGO_BANCO",        1,   3),
            new BankLayoutField("3O", "CODIGO_LOTE",         4,   7),
            new BankLayoutField("3O", "TIPO_REGISTRO",       8,   8),
            new BankLayoutField("3O", "NUM_REGISTRO",        9,   13),
            new BankLayoutField("3O", "SEGMENTO",            14,  14),
            new BankLayoutField("3O", "TIPO_MOVIMENTO",      15,  15),
            new BankLayoutField("3O", "COD_INSTRUCAO",       16,  17),
            new BankLayoutField("3O", "COD_BARRAS",          18,  61),
            new BankLayoutField("3O", "NOME_CONCESSIONARIA", 62,  91),
            new BankLayoutField("3O", "DATA_VENCIMENTO",     92,  99),
            new BankLayoutField("3O", "VALOR_PAGTO",         100, 114),
            new BankLayoutField("3O", "SEU_NUMERO",          115, 134),
            new BankLayoutField("3O", "NOSSO_NUMERO",        135, 149), // retorno
            new BankLayoutField("3O", "DATA_PAGTO",          145, 152),
            new BankLayoutField("3O", "DATA_CREDITO",        153, 160), // retorno
            new BankLayoutField("3O", "VALOR_EFETIVO",       161, 175), // retorno
            new BankLayoutField("3O", "AVISO_FAVORECIDO",    230, 230),
            new BankLayoutField("3O", "OCORRENCIAS",         231, 240)
    );

    // ── Trailer de Lote (tipo 5) ──────────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_LOTE = List.of(
            new BankLayoutField("5", "CODIGO_BANCO",    1,   3),
            new BankLayoutField("5", "CODIGO_LOTE",     4,   7),
            new BankLayoutField("5", "TIPO_REGISTRO",   8,   8),
            new BankLayoutField("5", "QTD_REGISTROS",   18,  23),
            new BankLayoutField("5", "SOMA_VALORES",    24,  41),
            new BankLayoutField("5", "QTD_MOEDAS",      42,  59),
            new BankLayoutField("5", "OCORRENCIAS",     231, 240)
    );

    // ── Trailer de Arquivo (tipo 9) ───────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_ARQUIVO = List.of(
            new BankLayoutField("9", "CODIGO_BANCO",    1,  3),
            new BankLayoutField("9", "CODIGO_LOTE",     4,  7),
            new BankLayoutField("9", "TIPO_REGISTRO",   8,  8),
            new BankLayoutField("9", "QTD_LOTES",       18, 23),
            new BankLayoutField("9", "QTD_REGISTROS",   24, 29),
            new BankLayoutField("9", "QTD_CONTAS",      30, 35)
    );

    // ── Mapa principal ────────────────────────────────────────────────────
    private static final Map<String, List<BankLayoutField>> FIELDS_BY_RECORD_TYPE =
            Map.of(
                    "0",  HEADER_ARQUIVO,
                    "1",  HEADER_LOTE,
                    "3A", DETALHE_A,
                    "3J", DETALHE_J,
                    "3O", DETALHE_O,
                    "5",  TRAILER_LOTE,
                    "9",  TRAILER_ARQUIVO
            );

    public static List<BankLayoutField> getFieldsForLine(String line) {
        if (line == null || line.length() < 8) return Collections.emptyList();
        char tipo = line.charAt(7);
        String key;
        if (tipo == '3') {
            if (line.length() < 14) return Collections.emptyList();
            key = "3" + line.charAt(13);
        } else {
            key = String.valueOf(tipo);
        }
        return FIELDS_BY_RECORD_TYPE.getOrDefault(key, Collections.emptyList());
    }

    public static String getRecordType(String line) {
        if (line == null || line.length() < 8) return "?";
        char tipo = line.charAt(7);
        if (tipo == '3') {
            if (line.length() < 14) return "3?";
            return "3" + line.charAt(13);
        }
        return String.valueOf(tipo);
    }
}