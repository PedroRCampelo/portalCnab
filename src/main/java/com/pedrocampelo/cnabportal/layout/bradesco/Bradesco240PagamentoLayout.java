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
 * Segmentos cobertos:
 *   A  — Crédito em Conta, TED, PIX, Pagamento com Autenticação
 *   J  — Pagamento de Títulos de Cobrança (boletos)
 *   J52 — Complemento do Segmento J (Sacador / Cedente / Sacado)
 *   O  — Pagamento de Contas e Tributos com Código de Barras
 *
 * Todas as posições são 1-based, conforme o manual Bradesco Multipag v08.
 *
 * ─── CORREÇÕES APLICADAS ─────────────────────────────────────────────────────
 *
 * [BUG-1] HEADER_ARQUIVO / HEADER_LOTE
 *   - Faltava DV_AGENCIA (pos 58) e DV_AG_CONTA (pos 72)
 *   - CONTA estava em 58-70; correto: 59-70
 *   - FINALIDADE_LOTE estava em 103-132 (30 chars); correto: 103-142 (40 chars)
 *   - HISTORICO_CC estava em 133-142 (10 chars); correto: 143-172 (30 chars)
 *
 * [BUG-2] DETALHE_A / DETALHE_J / DETALHE_O — deslocamento geral de +1 posição
 *   - TIPO_MOVIMENTO declarado como 1 char (15-15); correto: 2 chars (15-16)
 *   - Consequência: todos os campos seguintes estavam 1 posição antes do esperado,
 *     lendo dados errados do arquivo CNAB.
 *   - Correções específicas do Segmento A:
 *       CAMARA         18-20  →  19-21
 *       BANCO_FAV      21-23  →  22-24
 *       CONTA_FAV      30-41  →  31-42
 *       NOME_FAV       44-73  →  45-74
 *       DATA_PAGTO     94-101 →  95-102
 *       VALOR_PAGTO   120-134 → 121-135
 *       HISTORICO_CC  178-197 → 179-210 (32 chars, não 20)
 *       COD_FINALIDADE 198-199 → 211-212
 *       AVISO_FAV       230   →   222
 *       QTD_MOEDA [novo campo] 106-120
 *   - Correções específicas do Segmento J:
 *       COD_BARRAS   18-61 → 19-62  ← bug que causava leitura errada do código de barras
 *       NOME_CEDENTE 62-91 → 63-92
 *       VALOR_TITULO 100-114 → 101-115
 *       VALOR_PAGTO  153-167 → 154-168
 *       SEU_NUMERO   168-187 → 169-188
 *       NOSSO_NUMERO 188-202 → 191-210
 *       DATA_CREDITO 205-212 → 211-218
 *   - Correções específicas do Segmento O:
 *       sobreposição entre SEU_NUMERO / NOSSO_NUMERO / DATA_PAGTO eliminada
 *
 * [BUG-3] Segmento J-52 ausente
 *   - J-52 era retornado como recordType "3J" e aparecia como linha extra e corrompida
 *     na aba "Seg J — Boletos".
 *   - Adicionado: DETALHE_J52, detecção em isJ52(), key "3J52" no mapa principal.
 *
 * [BUG-4] Linha com 241 chars (espaço inicial)
 *   - Segmento B com espaço extra no início deslocava o tipo_registro (pos 8) de '3' para '1',
 *     fazendo o parser classificar o registro como Header de Lote.
 *   - Adicionado: normalizeLine() chamado em getFieldsForLine() e getRecordType().
 */
public class Bradesco240PagamentoLayout {

    // ── Header de Arquivo (tipo 0) ────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_ARQUIVO = List.of(
            new BankLayoutField("0", "CODIGO_BANCO",      1,   3),   // 237
            new BankLayoutField("0", "CODIGO_LOTE",       4,   7),   // 0000
            new BankLayoutField("0", "TIPO_REGISTRO",     8,   8),   // 0
            new BankLayoutField("0", "USO EXCLUSIVO FEB",     9,   17),  
            new BankLayoutField("0", "TIPO_INSCRICAO",    18,  18),  // 1=CPF 2=CNPJ
            new BankLayoutField("0", "INSCRICAO_EMPRESA", 19,  32),
            new BankLayoutField("0", "CONVENIO",          33,  52),
            new BankLayoutField("0", "AGENCIA",           53,  57),
            new BankLayoutField("0", "DV_AGENCIA",        58,  58),  // [FIX-1] campo faltante
            new BankLayoutField("0", "CONTA",             59,  70),  // [FIX-1] era 58-70
            new BankLayoutField("0", "DV_CONTA",          71,  71),
            new BankLayoutField("0", "DV_AG_CONTA",       72,  72),  // [FIX-1] campo faltante
            new BankLayoutField("0", "NOME_EMPRESA",      73,  102),
            new BankLayoutField("0", "NOME_BANCO",        103, 132),
            new BankLayoutField("0", "USO EXCLUSIVO FEB",        133, 142),
            new BankLayoutField("0", "ARQUIVO_CODIGO",    143, 143), // 1=remessa 2=retorno
            new BankLayoutField("0", "DATA_GERACAO",      144, 151),
            new BankLayoutField("0", "HORA_GERACAO",      152, 157),
            new BankLayoutField("0", "NUM_SEQ_ARQUIVO",   158, 163),
            new BankLayoutField("0", "VERSAO_LAYOUT",     164, 166)
            );

    // ── Header de Lote (tipo 1) ───────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_LOTE = List.of(
            new BankLayoutField("1", "CODIGO_BANCO",      1,   3),
            new BankLayoutField("1", "CODIGO_LOTE",       4,   7),
            new BankLayoutField("1", "TIPO_REGISTRO",     8,   8),
            new BankLayoutField("1", "TIPO_OPERACAO",     9,   9),   // C=crédito
            new BankLayoutField("1", "TIPO_SERVICO",      10,  11),
            new BankLayoutField("1", "FORMA_PAGAMENTO",   12,  13),
            new BankLayoutField("1", "VERSAO_LOTE",       14,  16),
            new BankLayoutField("1", "USO EXCLUSIVO FEB",       17,  17),
            new BankLayoutField("1", "TIPO_INSCRICAO",    18,  18),
            new BankLayoutField("1", "INSCRICAO_EMPRESA", 19,  32),
            new BankLayoutField("1", "CONVENIO",          33,  52),
            new BankLayoutField("1", "AGENCIA",           53,  57),
            new BankLayoutField("1", "DV_AGENCIA",        58,  58),  // [FIX-1] campo faltante
            new BankLayoutField("1", "CONTA",             59,  70),  // [FIX-1] era 58-70
            new BankLayoutField("1", "DV_CONTA",          71,  71),
            new BankLayoutField("1", "DV_AG_CONTA",       72,  72),  // [FIX-1] campo faltante
            new BankLayoutField("1", "NOME_EMPRESA",      73,  102),
            new BankLayoutField("1", "FINALIDADE_LOTE",   103, 142), 
            new BankLayoutField("1", "NOME DA RUA, AV",      143, 172), 
            new BankLayoutField("1", "NUMERO LOC",      173, 177),
            new BankLayoutField("1", "CASA, APTO",      178, 192), 
            new BankLayoutField("1", "NOME CIDADE",      193, 212), 
            new BankLayoutField("1", "CEP",      213, 217),
            new BankLayoutField("1", "COMP CEP",      218, 220), 
            new BankLayoutField("1", "SIGLA EST",      221, 222), 
            new BankLayoutField("1", "FORM PAG",      223, 224), 
            new BankLayoutField("1", "USO EXCLUSIVO FEB",      225, 230), 
            new BankLayoutField("1", "OCORRENCIAS",       231, 240)  
    );

    // ── Detalhe Segmento A (tipo 3, seg A) ───────────────────────────────
    // Crédito em Conta, Cheque, OP, TED, PIX, Pagamento com Autenticação
    private static final List<BankLayoutField> DETALHE_A = List.of(
            new BankLayoutField("3A", "CODIGO_BANCO",      1,   3),
            new BankLayoutField("3A", "CODIGO_LOTE",       4,   7),
            new BankLayoutField("3A", "TIPO_REGISTRO",     8,   8),
            new BankLayoutField("3A", "NUM_REGISTRO",      9,   13),
            new BankLayoutField("3A", "SEGMENTO",          14,  14),
            new BankLayoutField("3A", "TIPO_MOVIMENTO",    15,  15), // [FIX-2] era 15-15 (1→2 chars)
            new BankLayoutField("3A", "COD_INSTRUCAO",     16,  17), // [FIX-2] era 16-17
            new BankLayoutField("3A", "CAMARA",            18,  20), // [FIX-2] era 18-20
            new BankLayoutField("3A", "BANCO_FAVORECIDO",  21,  23), // [FIX-2] era 21-23
            new BankLayoutField("3A", "AGENCIA_FAV",       24,  28), // [FIX-2] era 24-28
            new BankLayoutField("3A", "DAC_AGENCIA_FAV",   29,  29), // [FIX-2] era 29-29
            new BankLayoutField("3A", "CONTA_FAV",         30,  41), // [FIX-2] era 30-41
            new BankLayoutField("3A", "DAC_CONTA_FAV",     42,  42), // [FIX-2] era 42-42
            new BankLayoutField("3A", "DAC_AG_CONTA_FAV",  43,  43), // [FIX-2] era 43-43
            new BankLayoutField("3A", "NOME_FAVORECIDO",   44,  73), // [FIX-2] era 44-73
            new BankLayoutField("3A", "SEU_NUMERO",        74,  93), // [FIX-2] era 74-93
            new BankLayoutField("3A", "DATA_PAGTO",        94,  101),// [FIX-2] era 94-101
            new BankLayoutField("3A", "TIPO_MOEDA",        102, 104),// [FIX-2] era 102-104
            new BankLayoutField("3A", "QTD_MOEDA",         105, 119),// [FIX-2] campo faltante
            new BankLayoutField("3A", "VALOR_PAGTO",       120, 134),// [FIX-2] era 120-134
            new BankLayoutField("3A", "NOSSO_NUMERO",      135, 154),// [FIX-2] era 135-149 — retorno
            new BankLayoutField("3A", "DATA_EFETIVA",      155, 162),// [FIX-2] era 155-162 — retorno
            new BankLayoutField("3A", "VALOR_EFETIVO",     163, 177),// [FIX-2] era 163-177 — retorno
            new BankLayoutField("3A", "HISTORICO_CC",      178, 217),// [FIX-2] era 178-197 (20→32 chars)
            new BankLayoutField("3A", "CNAB - USO FEBRABAN",    218, 219),// [FIX-2] era 198-199
            new BankLayoutField("3A", "COD_FINALIDADE",    220, 224),// [FIX-2] era 198-199
            new BankLayoutField("3A", "FINALIDADE_TED",    225, 226),// [FIX-2] era 200-204
            new BankLayoutField("3A", "TIPO_CONTA_FAV",    227, 229),// [FIX-2] era 205-207
            new BankLayoutField("3A", "AVISO_FAVORECIDO",  230, 230),// [FIX-2] era 230-230
            new BankLayoutField("3A", "OCORRENCIAS",       231, 240)
    );

    // ── Detalhe Segmento J (tipo 3, seg J) ───────────────────────────────
    // Pagamento de Títulos de Cobrança (boletos)
    private static final List<BankLayoutField> DETALHE_J = List.of(
            new BankLayoutField("3J", "CODIGO_BANCO",      1,   3),
            new BankLayoutField("3J", "CODIGO_LOTE",       4,   7),
            new BankLayoutField("3J", "TIPO_REGISTRO",     8,   8),
            new BankLayoutField("3J", "NUM_REGISTRO",      9,   13),
            new BankLayoutField("3J", "SEGMENTO",          14,  14),
            new BankLayoutField("3J", "TIPO_MOVIMENTO",    15,  15), // [FIX-2] era 15-15 (1→2 chars)
            new BankLayoutField("3J", "COD_INSTRUCAO",     16,  17), // [FIX-2] era 16-17
            new BankLayoutField("3J", "COD_BARRAS",        18,  61), // [FIX-2] era 18-61 ← BUG PRINCIPAL
            new BankLayoutField("3J", "NOME_CEDENTE",      62,  91), // [FIX-2] era 62-91
            new BankLayoutField("3J", "DATA_VENCIMENTO",   92,  99),// [FIX-2] era 92-99
            new BankLayoutField("3J", "VALOR_TITULO",      100, 114),// [FIX-2] era 100-114
            new BankLayoutField("3J", "DESCONTO",          115, 129),// [FIX-2] era 115-129
            new BankLayoutField("3J", "ACRESCIMO",         130, 144),// [FIX-2] era 130-144
            new BankLayoutField("3J", "DATA_PAGTO",        145, 152),// [FIX-2] era 145-152
            new BankLayoutField("3J", "VALOR_PAGTO",       153, 167),// [FIX-2] era 153-167
            new BankLayoutField("3J", "QUANT MOEDA",        168, 182),// [FIX-2] era 168-187
            new BankLayoutField("3J", "NOSSO_NUMERO",    183, 202),// [FIX-2] campo faltante
            new BankLayoutField("3J", "NOSSO_NUMERO(BCO)",      203, 222),// [FIX-2] era 188-202 — retorno
            new BankLayoutField("3J", "COD MOEDA",      223, 224),// [FIX-2] era 205-212 — retorno
            new BankLayoutField("3J", "USO EXCLUSIVO FEB",  225, 230),
            new BankLayoutField("3J", "OCORRENCIAS",       231, 240)
    );

    // ── Detalhe Segmento J-52 (tipo 3, seg J, id 52) ─────────────────────
    // [FIX-3] Novo: complemento do Segmento J com dados de Sacador/Cedente/Sacado.
    // Identificado por pos 15-16 == "52" (padrão FEBRABAN) ou por heurística de conteúdo.
    // Antes desta correção, J-52 era parseado como J regular e aparecia como linha
    // extra e corrompida na aba "Seg J — Boletos".
    private static final List<BankLayoutField> DETALHE_J52 = List.of(
            new BankLayoutField("3J52", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3J52", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3J52", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3J52", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3J52", "SEGMENTO",           14,  14),
            new BankLayoutField("3J52", "CNAB - USO EXCLUSIVO FEB",           15,  15),
            new BankLayoutField("3J52", "CÓD DE MOV",      16,  17), // = "52"
            new BankLayoutField("3J52", "IDENTIFICACAO",      18,  19), // = "52"
            new BankLayoutField("3J52", "TIPO_INSC_SACADOR",  20,  20),
            new BankLayoutField("3J52", "NR_INSC_SACADOR",    21,  35),
            new BankLayoutField("3J52", "NOME_SACADOR",       36,  75),
            new BankLayoutField("3J52", "TIPO_INSC_CEDENTE",  76,  76),
            new BankLayoutField("3J52", "NR_INSC_CEDENTE",    77,  91),
            new BankLayoutField("3J52", "NOME_CEDENTE",       92,  131),
            new BankLayoutField("3J52", "TIPO_INSC_SACADO",   132, 132),
            new BankLayoutField("3J52", "NR_INSC_SACADO",     133, 147),
            new BankLayoutField("3J52", "NOME_SACADO",        148, 187),
            new BankLayoutField("3J52", "USO EXCLUSIVO FEBRABAN",        188, 240)
            );

    // ── Detalhe Segmento O (tipo 3, seg O) ───────────────────────────────
    // Pagamento de Contas e Tributos com Código de Barras
    private static final List<BankLayoutField> DETALHE_O = List.of(
            new BankLayoutField("3O", "CODIGO_BANCO",        1,   3),
            new BankLayoutField("3O", "CODIGO_LOTE",         4,   7),
            new BankLayoutField("3O", "TIPO_REGISTRO",       8,   8),
            new BankLayoutField("3O", "NUM_REGISTRO",        9,   13),
            new BankLayoutField("3O", "SEGMENTO",            14,  14),
            new BankLayoutField("3O", "TIPO_MOVIMENTO",      15,  16), // [FIX-2] era 15-15
            new BankLayoutField("3O", "COD_INSTRUCAO",       17,  18), // [FIX-2] era 16-17
            new BankLayoutField("3O", "COD_BARRAS",          19,  62), // [FIX-2] era 18-61
            new BankLayoutField("3O", "NOME_CONCESSIONARIA", 63,  92), // [FIX-2] era 62-91
            new BankLayoutField("3O", "DATA_VENCIMENTO",     93,  100),// [FIX-2] era 92-99
            new BankLayoutField("3O", "VALOR_PAGTO",         101, 115),// [FIX-2] era 100-114
            new BankLayoutField("3O", "SEU_NUMERO",          116, 135),// [FIX-2] era 115-134
            new BankLayoutField("3O", "NOSSO_NUMERO",        136, 150),// [FIX-2] era 135-149 — retorno
            new BankLayoutField("3O", "DATA_PAGTO",          151, 158),// [FIX-2] era 145-152 (sobreposição corrigida)
            new BankLayoutField("3O", "DATA_CREDITO",        159, 166),// [FIX-2] era 153-160 — retorno
            new BankLayoutField("3O", "VALOR_EFETIVO",       167, 181),// [FIX-2] era 161-175 — retorno
            new BankLayoutField("3O", "AVISO_FAVORECIDO",    230, 230),
            new BankLayoutField("3O", "OCORRENCIAS",         231, 240)
    );

    // ── Trailer de Lote (tipo 5) ──────────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_LOTE = List.of(
            new BankLayoutField("5", "CODIGO_BANCO",   1,   3),
            new BankLayoutField("5", "CODIGO_LOTE",    4,   7),
            new BankLayoutField("5", "TIPO_REGISTRO",  8,   8),
            new BankLayoutField("5", "QTD_REGISTROS",  18,  23),
            new BankLayoutField("5", "SOMA_VALORES",   24,  41),
            new BankLayoutField("5", "QTD_MOEDAS",     42,  59),
            new BankLayoutField("5", "OCORRENCIAS",    231, 240)
    );

    // ── Trailer de Arquivo (tipo 9) ───────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_ARQUIVO = List.of(
            new BankLayoutField("9", "CODIGO_BANCO",   1,  3),
            new BankLayoutField("9", "CODIGO_LOTE",    4,  7),
            new BankLayoutField("9", "TIPO_REGISTRO",  8,  8),
            new BankLayoutField("9", "QTD_LOTES",      18, 23),
            new BankLayoutField("9", "QTD_REGISTROS",  24, 29),
            new BankLayoutField("9", "QTD_CONTAS",     30, 35)
    );

    // ── Mapa principal ────────────────────────────────────────────────────
    private static final Map<String, List<BankLayoutField>> FIELDS_BY_RECORD_TYPE =
            Map.of(
                    "0",    HEADER_ARQUIVO,
                    "1",    HEADER_LOTE,
                    "3A",   DETALHE_A,
                    "3J",   DETALHE_J,
                    "3J52", DETALHE_J52,  // [FIX-3] adicionado
                        "3O",   DETALHE_O,
                    "5",    TRAILER_LOTE,
                    "9",    TRAILER_ARQUIVO
            );

    // ── Normalização de linha ─────────────────────────────────────────────

    /**
     * [FIX-4] Normaliza a linha para exatamente 240 chars.
     *
     * Causa do bug: Segmento B gerado com espaço extra no início (241 chars).
     * O char na posição 8 (tipo_registro) se tornava '1' em vez de '3',
     * fazendo o parser classificar o registro como Header de Lote.
     */
    public static String normalizeLine(String line) {
        if (line == null) return null;
        // Remove quebras de linha do final
        if (line.endsWith("\r\n")) line = line.substring(0, line.length() - 2);
        else if (line.endsWith("\n") || line.endsWith("\r")) line = line.substring(0, line.length() - 1);

        if (line.length() == 241 && line.charAt(0) == ' ') {
            // Espaço extra no início → remove (corrige Segmento B)
            return line.substring(1);
        }
        return line;
    }

    // ── Detecção de J-52 ─────────────────────────────────────────────────

    /**
     * [FIX-3] Retorna true se a linha for um Segmento J-52.
     *
     * Padrão FEBRABAN: pos 15-16 (índices 14-15) == "52".
     * Heurística adicional: área do código de barras (pos 19-20) contém
     * tipo de inscrição ("01" CPF ou "02" CNPJ) em vez de início de código de barras.
     */
    private static boolean isJ52(String line) {
       if (line == null || line.length() <19) return false;
       
       return "52".equals(line.substring(17,19));
    }

    // ── API pública ───────────────────────────────────────────────────────

    public static List<BankLayoutField> getFieldsForLine(String line) {
        line = normalizeLine(line); // [FIX-4]
        if (line == null || line.length() < 8) return Collections.emptyList();
        char tipo = line.charAt(7); // pos 8 (0-indexed: 7)
        String key;
        if (tipo == '3') {
            if (line.length() < 14) return Collections.emptyList();
            char seg = line.charAt(13); // pos 14 (0-indexed: 13)
            if (seg == 'J' && isJ52(line)) {
                key = "3J52"; // [FIX-3]
            } else {
                key = "3" + seg;
            }
        } else {
            key = String.valueOf(tipo);
        }
        return FIELDS_BY_RECORD_TYPE.getOrDefault(key, Collections.emptyList());
    }

    public static String getRecordType(String line) {
        line = normalizeLine(line); // [FIX-4]
        if (line == null || line.length() < 8) return "?";
        char tipo = line.charAt(7);
        if (tipo == '3') {
            if (line.length() < 14) return "3?";
            char seg = line.charAt(13);
            if (seg == 'J' && isJ52(line)) return "3J52"; // [FIX-3]
            return "3" + seg;
        }
        return String.valueOf(tipo);
    }
}