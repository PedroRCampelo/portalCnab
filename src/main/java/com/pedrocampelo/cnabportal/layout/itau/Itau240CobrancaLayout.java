package com.pedrocampelo.cnabportal.layout.itau;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Layout Itaú CNAB 240 — Cobrança Bancária (FEBRABAN 240), Janeiro 2017.
 *
 * Estrutura hierárquica de 240 bytes por linha:
 *   Tipo de registro (pos 8, index 7):
 *     0 = Header de Arquivo
 *     1 = Header de Lote
 *     3 = Detalhe  →  Segmento (pos 14, index 13): P | Q | R | S | T | Y | Z
 *     5 = Trailer de Lote
 *     9 = Trailer de Arquivo
 *
 * Segmentos OBRIGATÓRIOS cobertos aqui:
 *   P — Dados do título (nosso número, vencimento, valor, etc.)
 *   Q — Dados do pagador (nome, CPF/CNPJ, endereço)
 *
 * Remessa/Retorno: posição 143 (index 142) do Header de Arquivo.
 *   '1' = remessa  |  '2' = retorno
 *
 * Posições 1-based conforme o manual.
 */
public class Itau240CobrancaLayout {

    // ── Header de Arquivo (tipo 0) ────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_ARQUIVO = List.of(
            new BankLayoutField("0", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("0", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("0", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("0", "TIPO_INSCRICAO",     18,  18),
            new BankLayoutField("0", "INSCRICAO_EMPRESA",  19,  32),
            new BankLayoutField("0", "AGENCIA",            54,  57),
            new BankLayoutField("0", "CONTA",              66,  70),
            new BankLayoutField("0", "DAC",                72,  72),
            new BankLayoutField("0", "NOME_EMPRESA",       73,  102),
            new BankLayoutField("0", "NOME_BANCO",         103, 132),
            new BankLayoutField("0", "ARQUIVO_CODIGO",     143, 143),  // 1=remessa 2=retorno
            new BankLayoutField("0", "DATA_GERACAO",       144, 151),
            new BankLayoutField("0", "HORA_GERACAO",       152, 157),
            new BankLayoutField("0", "VERSAO_LAYOUT",      164, 166)
    );

    // ── Header de Lote (tipo 1) ───────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_LOTE = List.of(
            new BankLayoutField("1", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("1", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("1", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("1", "OPERACAO",           9,   9),   // R=remessa T=retorno
            new BankLayoutField("1", "CODIGO_SERVICO",     10,  11),  // '01'
            new BankLayoutField("1", "VERSAO_LOTE",        14,  16),
            new BankLayoutField("1", "TIPO_INSCRICAO",     18,  18),
            new BankLayoutField("1", "INSCRICAO_EMPRESA",  19,  33),
            new BankLayoutField("1", "AGENCIA",            55,  58),
            new BankLayoutField("1", "CONTA",              67,  71),
            new BankLayoutField("1", "DAC",                73,  73),
            new BankLayoutField("1", "NOME_EMPRESA",       74,  103),
            new BankLayoutField("1", "DATA_GRAVACAO",      192, 199),
            new BankLayoutField("1", "DATA_CREDITO",       200, 207)
    );

    // ── Detalhe Segmento P (tipo 3, seg P) — OBRIGATÓRIO ─────────────────
    // Dados do título de cobrança
    private static final List<BankLayoutField> DETALHE_P = List.of(
            new BankLayoutField("3P", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3P", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3P", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3P", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3P", "SEGMENTO",           14,  14),
            new BankLayoutField("3P", "COD_OCORRENCIA",     16,  17),
            new BankLayoutField("3P", "AGENCIA",            19,  22),
            new BankLayoutField("3P", "CONTA",              31,  35),
            new BankLayoutField("3P", "DAC",                37,  37),
            new BankLayoutField("3P", "CARTEIRA",           38,  40),
            new BankLayoutField("3P", "NOSSO_NUMERO",       41,  48),
            new BankLayoutField("3P", "DAC_NOSSO_NUMERO",   49,  49),
            new BankLayoutField("3P", "NUM_DOCUMENTO",      63,  72),
            new BankLayoutField("3P", "VENCIMENTO",         78,  85),
            new BankLayoutField("3P", "VALOR_TITULO",       86,  100),
            new BankLayoutField("3P", "AGENCIA_COBRADORA",  101, 105),
            new BankLayoutField("3P", "ESPECIE_TITULO",     107, 108),
            new BankLayoutField("3P", "ACEITE",             109, 109),
            new BankLayoutField("3P", "DATA_EMISSAO",       110, 117),
            new BankLayoutField("3P", "DATA_JUROS_MORA",    119, 126),
            new BankLayoutField("3P", "JUROS_1_DIA",        127, 141),
            new BankLayoutField("3P", "DATA_1_DESCONTO",    143, 150),
            new BankLayoutField("3P", "VALOR_1_DESCONTO",   151, 165),
            new BankLayoutField("3P", "VALOR_IOF",          166, 180),
            new BankLayoutField("3P", "VALOR_ABATIMENTO",   181, 195),
            new BankLayoutField("3P", "USO_EMPRESA",        196, 220),
            new BankLayoutField("3P", "COD_NEGATIVACAO",    221, 221),
            new BankLayoutField("3P", "PRAZO_NEGATIVACAO",  222, 223),
            new BankLayoutField("3P", "COD_BAIXA",          224, 224),
            new BankLayoutField("3P", "PRAZO_BAIXA",        225, 226)
    );

    // ── Detalhe Segmento Q (tipo 3, seg Q) — OBRIGATÓRIO ─────────────────
    // Dados do pagador
    private static final List<BankLayoutField> DETALHE_Q = List.of(
            new BankLayoutField("3Q", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3Q", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3Q", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3Q", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3Q", "SEGMENTO",           14,  14),
            new BankLayoutField("3Q", "COD_OCORRENCIA",     16,  17),
            new BankLayoutField("3Q", "TIPO_INSCRICAO_PAG", 18,  18),
            new BankLayoutField("3Q", "INSCRICAO_PAGADOR",  19,  33),
            new BankLayoutField("3Q", "NOME_PAGADOR",       34,  63),
            new BankLayoutField("3Q", "LOGRADOURO",         74,  113),
            new BankLayoutField("3Q", "BAIRRO",             114, 128),
            new BankLayoutField("3Q", "CEP",                129, 133),
            new BankLayoutField("3Q", "SUFIXO_CEP",         134, 136),
            new BankLayoutField("3Q", "CIDADE",             137, 151),
            new BankLayoutField("3Q", "UF",                 152, 153),
            new BankLayoutField("3Q", "TIPO_INSCRICAO_AVA", 154, 154),
            new BankLayoutField("3Q", "INSCRICAO_AVALISTA", 155, 169),
            new BankLayoutField("3Q", "NOME_AVALISTA",      170, 199)
    );

    // ── Trailer de Lote (tipo 5) ──────────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_LOTE = List.of(
            new BankLayoutField("5", "CODIGO_BANCO",    1,  3),
            new BankLayoutField("5", "CODIGO_LOTE",     4,  7),
            new BankLayoutField("5", "TIPO_REGISTRO",   8,  8),
            new BankLayoutField("5", "QTD_REGISTROS",   18, 23),
            new BankLayoutField("5", "QTD_TITULOS",     24, 29),
            new BankLayoutField("5", "SOMA_VALORES",    30, 46),
            new BankLayoutField("5", "QTD_TITULOS_CAN", 47, 52),
            new BankLayoutField("5", "SOMA_CANC",       53, 69)
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
                    "3P", DETALHE_P,
                    "3Q", DETALHE_Q,
                    "5",  TRAILER_LOTE,
                    "9",  TRAILER_ARQUIVO
            );

    /** Retorna os campos para a linha. Chave: "0","1","3P","3Q","5","9". */
    public static List<BankLayoutField> getFieldsForLine(String line) {
        if (line == null || line.length() < 8) return Collections.emptyList();
        char tipo = line.charAt(7); // pos 8 (1-based)
        String key;
        if (tipo == '3') {
            if (line.length() < 14) return Collections.emptyList();
            key = "3" + line.charAt(13); // pos 14
        } else {
            key = String.valueOf(tipo);
        }
        return FIELDS_BY_RECORD_TYPE.getOrDefault(key, Collections.emptyList());
    }

    /** RecordType canônico: "0","1","3P","3Q","5","9","3?" para segmentos opcionais. */
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