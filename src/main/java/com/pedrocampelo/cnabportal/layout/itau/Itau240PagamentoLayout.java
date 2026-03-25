package com.pedrocampelo.cnabportal.layout.itau;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Layout Itaú CNAB 240 — SISPAG (Pagamento) — Versão 085, outubro/2020.
 *
 * Estrutura hierárquica de 240 bytes por linha:
 *
 *   Tipo de registro (pos 8):
 *     0 = Header de Arquivo
 *     1 = Header de Lote
 *     3 = Detalhe  →  Segmento (pos 14): A | J | O | N | B | C | W | Z
 *     5 = Trailer de Lote
 *     9 = Trailer de Arquivo
 *
 * Esta classe cobre apenas os segmentos OBRIGATÓRIOS:
 *   A  — Crédito em conta / DOC / TED / PIX Transferência / Cheque / OP
 *   J  — Liquidação de boletos (cobrança Itaú e outros bancos)
 *   O  — Concessionárias e tributos com código de barras
 *   N  — Tributos sem código de barras e FGTS
 *
 * Posições conforme o manual: 1-based, inclusive.
 */
public class Itau240PagamentoLayout {

    // ── recordType keys usados em ParsedRecord ────────────────────────────
    // Registros estruturais: "0", "1", "5", "9"
    // Segmentos de detalhe:  "3A", "3J", "3O", "3N"

    // ── Header de Arquivo (tipo 0) ────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_ARQUIVO = List.of(
            new BankLayoutField("0", "CODIGO_BANCO",      1,   3),
            new BankLayoutField("0", "CODIGO_LOTE",       4,   7),
            new BankLayoutField("0", "TIPO_REGISTRO",     8,   8),
            new BankLayoutField("0", "VERSAO_LAYOUT",     15,  17),
            new BankLayoutField("0", "TIPO_INSCRICAO",    18,  18),
            new BankLayoutField("0", "INSCRICAO_EMPRESA", 19,  32),
            new BankLayoutField("0", "AGENCIA",           53,  57),
            new BankLayoutField("0", "CONTA",             59,  70),
            new BankLayoutField("0", "DAC",               72,  72),
            new BankLayoutField("0", "NOME_EMPRESA",      73,  102),
            new BankLayoutField("0", "NOME_BANCO",        103, 132),
            new BankLayoutField("0", "ARQUIVO_CODIGO",    143, 143),  // 1=remessa 2=retorno
            new BankLayoutField("0", "DATA_GERACAO",      144, 151),
            new BankLayoutField("0", "HORA_GERACAO",      152, 157)
    );

    // ── Header de Lote (tipo 1) ───────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_LOTE = List.of(
            new BankLayoutField("1", "CODIGO_BANCO",      1,   3),
            new BankLayoutField("1", "CODIGO_LOTE",       4,   7),
            new BankLayoutField("1", "TIPO_REGISTRO",     8,   8),
            new BankLayoutField("1", "TIPO_OPERACAO",     9,   9),   // C=crédito
            new BankLayoutField("1", "TIPO_PAGAMENTO",    10,  11),
            new BankLayoutField("1", "FORMA_PAGAMENTO",   12,  13),
            new BankLayoutField("1", "TIPO_INSCRICAO",    18,  18),
            new BankLayoutField("1", "INSCRICAO_EMPRESA", 19,  32),
            new BankLayoutField("1", "AGENCIA",           53,  57),
            new BankLayoutField("1", "CONTA",             59,  70),
            new BankLayoutField("1", "DAC",               72,  72),
            new BankLayoutField("1", "NOME_EMPRESA",      73,  102),
            new BankLayoutField("1", "FINALIDADE_LOTE",   103, 132),
            new BankLayoutField("1", "OCORRENCIAS",       231, 240)  // só no retorno
    );

    // ── Detalhe Segmento A (tipo 3, seg A) ────────────────────────────────
    // Crédito em C/C, Poupança, DOC, TED, PIX Transferência, Cheque, OP
    private static final List<BankLayoutField> DETALHE_A = List.of(
            new BankLayoutField("3A", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3A", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3A", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3A", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3A", "SEGMENTO",           14,  14),
            new BankLayoutField("3A", "TIPO_MOVIMENTO",     15,  17),
            new BankLayoutField("3A", "CAMARA",             18,  20),
            new BankLayoutField("3A", "BANCO_FAVORECIDO",   21,  23),
            new BankLayoutField("3A", "AGENCIA_CONTA_FAV",  24,  43),
            new BankLayoutField("3A", "NOME_FAVORECIDO",    44,  73),
            new BankLayoutField("3A", "SEU_NUMERO",         74,  93),
            new BankLayoutField("3A", "DATA_PAGTO",         94,  101),
            new BankLayoutField("3A", "MOEDA_TIPO",         102, 104),
            new BankLayoutField("3A", "VALOR_PAGTO",        120, 134),
            new BankLayoutField("3A", "NOSSO_NUMERO",       135, 149),  // retorno
            new BankLayoutField("3A", "DATA_EFETIVA",       155, 162),  // retorno
            new BankLayoutField("3A", "VALOR_EFETIVO",      163, 177),  // retorno
            new BankLayoutField("3A", "FINALIDADE_DETALHE", 178, 197),
            new BankLayoutField("3A", "N_DOC_RETORNO",      198, 203),  // retorno
            new BankLayoutField("3A", "N_INSCRICAO_FAV",    204, 217),
            new BankLayoutField("3A", "FINALIDADE_DOC",     218, 219),
            new BankLayoutField("3A", "FINALIDADE_TED",     220, 224),
            new BankLayoutField("3A", "AVISO",              230, 230),
            new BankLayoutField("3A", "OCORRENCIAS",        231, 240)   // retorno
    );

    // ── Detalhe Segmento J (tipo 3, seg J) ────────────────────────────────
    // Liquidação de boletos (cobrança Itaú e outros bancos)
    private static final List<BankLayoutField> DETALHE_J = List.of(
            new BankLayoutField("3J", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3J", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3J", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3J", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3J", "SEGMENTO",           14,  14),
            new BankLayoutField("3J", "TIPO_MOVIMENTO",     15,  17),
            new BankLayoutField("3J", "COD_BARRAS",         18,  61),
            new BankLayoutField("3J", "NOME_CEDENTE",       62,  91),
            new BankLayoutField("3J", "DATA_VENCIMENTO",    92,  99),
            new BankLayoutField("3J", "VALOR_TITULO",       100, 114),
            new BankLayoutField("3J", "DESCONTO",           115, 129),
            new BankLayoutField("3J", "ACRESCIMO",          130, 144),
            new BankLayoutField("3J", "DATA_PAGTO",         145, 152),
            new BankLayoutField("3J", "VALOR_PAGTO",        153, 167),
            new BankLayoutField("3J", "SEU_NUMERO",         168, 187),
            new BankLayoutField("3J", "NOSSO_NUMERO",       188, 202),  // retorno
            new BankLayoutField("3J", "COD_MOEDA",          203, 204),
            new BankLayoutField("3J", "DATA_CREDITO",       205, 212),  // retorno
            new BankLayoutField("3J", "OCORRENCIAS",        231, 240)   // retorno
    );

    // ── Detalhe Segmento O (tipo 3, seg O) ────────────────────────────────
    // Pagamento de concessionárias e tributos COM código de barras
    private static final List<BankLayoutField> DETALHE_O = List.of(
            new BankLayoutField("3O", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3O", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3O", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3O", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3O", "SEGMENTO",           14,  14),
            new BankLayoutField("3O", "TIPO_MOVIMENTO",     15,  17),
            new BankLayoutField("3O", "COD_BARRAS",         18,  61),
            new BankLayoutField("3O", "NOME_CONCESSIONARIA", 62, 91),
            new BankLayoutField("3O", "DATA_VENCIMENTO",    92,  99),
            new BankLayoutField("3O", "VALOR_PAGTO",        100, 114),
            new BankLayoutField("3O", "SEU_NUMERO",         115, 134),
            new BankLayoutField("3O", "NOSSO_NUMERO",       135, 149),  // retorno
            new BankLayoutField("3O", "DATA_PAGTO",         145, 152),
            new BankLayoutField("3O", "DATA_CREDITO",       153, 160),  // retorno
            new BankLayoutField("3O", "VALOR_EFETIVO",      161, 175),  // retorno
            new BankLayoutField("3O", "OCORRENCIAS",        231, 240)   // retorno
    );

    // ── Detalhe Segmento N (tipo 3, seg N) ────────────────────────────────
    // Pagamento de tributos SEM código de barras e FGTS
    private static final List<BankLayoutField> DETALHE_N = List.of(
            new BankLayoutField("3N", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3N", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3N", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3N", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3N", "SEGMENTO",           14,  14),
            new BankLayoutField("3N", "TIPO_MOVIMENTO",     15,  17),
            new BankLayoutField("3N", "TIPO_TRIBUTO",       18,  19),
            new BankLayoutField("3N", "SERVICO_TRIBUTO",    20,  21),
            new BankLayoutField("3N", "NUM_DOC_TRIBUTO",    22,  61),
            new BankLayoutField("3N", "DATA_VENCIMENTO",    92,  99),
            new BankLayoutField("3N", "VALOR_PRINCIPAL",    100, 114),
            new BankLayoutField("3N", "DATA_PAGTO",         145, 152),
            new BankLayoutField("3N", "VALOR_PAGTO",        153, 167),
            new BankLayoutField("3N", "SEU_NUMERO",         168, 187),
            new BankLayoutField("3N", "NOSSO_NUMERO",       188, 202),  // retorno
            new BankLayoutField("3N", "DATA_CREDITO",       203, 210),  // retorno
            new BankLayoutField("3N", "OCORRENCIAS",        231, 240)   // retorno
    );

    // ── Trailer de Lote (tipo 5) ──────────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_LOTE = List.of(
            new BankLayoutField("5", "CODIGO_BANCO",    1,   3),
            new BankLayoutField("5", "CODIGO_LOTE",     4,   7),
            new BankLayoutField("5", "TIPO_REGISTRO",   8,   8),
            new BankLayoutField("5", "QTD_REGISTROS",   18,  23),
            new BankLayoutField("5", "SOMA_VALORES",    24,  41),
            new BankLayoutField("5", "QTD_MOEDAS",      42,  59),
            new BankLayoutField("5", "NUM_AVISOS",       60,  65),
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
    private static final Map<String, List<BankLayoutField>> FIELDS_BY_RECORD_TYPE = Map.of(
            "0",  HEADER_ARQUIVO,
            "1",  HEADER_LOTE,
            "3A", DETALHE_A,
            "3J", DETALHE_J,
            "3O", DETALHE_O,
            "3N", DETALHE_N,
            "5",  TRAILER_LOTE,
            "9",  TRAILER_ARQUIVO
    );

    /**
     * Retorna a lista de campos para a linha fornecida.
     *
     * A chave é montada assim:
     *   - Tipos 0, 1, 5, 9  →  String do char na pos 8 ("0", "1", "5", "9")
     *   - Tipo 3 (detalhe)  →  "3" + char na pos 14  ("3A", "3J", "3O", "3N")
     *
     * Posições 8 e 14 são 1-based conforme o manual → índices 7 e 13.
     */
    public static List<BankLayoutField> getFieldsForLine(String line) {
        if (line == null || line.length() < 8) return Collections.emptyList();

        char tipoRegistro = line.charAt(7); // pos 8 no manual (1-based)
        String key;

        if (tipoRegistro == '3') {
            if (line.length() < 14) return Collections.emptyList();
            char segmento = line.charAt(13); // pos 14 no manual (1-based)
            key = "3" + segmento;
        } else {
            key = String.valueOf(tipoRegistro);
        }

        return FIELDS_BY_RECORD_TYPE.getOrDefault(key, Collections.emptyList());
    }

    /**
     * Retorna o recordType canônico para uma linha.
     * Usado pelo parser para popular ParsedRecord.recordType.
     * Ex.: tipo 3 + segmento A → "3A"
     */
    public static String getRecordType(String line) {
        if (line == null || line.length() < 8) return "?";

        char tipoRegistro = line.charAt(7);

        if (tipoRegistro == '3') {
            if (line.length() < 14) return "3?";
            return "3" + line.charAt(13);
        }

        return String.valueOf(tipoRegistro);
    }
}