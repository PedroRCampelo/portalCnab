package com.pedrocampelo.cnabportal.layout.bb;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Layout Banco do Brasil CNAB 240 — Pagamentos (Remessa e Retorno).
 * Baseado no manual "Particularidades BB CNAB240 — Versão: novembro/2020".
 *
 * Banco: 001 — Banco do Brasil
 *
 * Tipo de registro (pos 8, index 7):
 *   0 = Header de Arquivo
 *   1 = Header de Lote
 *   3 = Detalhe  →  Segmento (pos 14, index 13)
 *   5 = Trailer de Lote
 *   9 = Trailer de Arquivo
 *
 * Segmentos cobertos:
 *   A  — Crédito em Conta, TED, DOC, PIX Transferência        (OBRIGATÓRIO — lote AB)
 *   J  — Pagamento de Boletos (BB e outros bancos)             (OBRIGATÓRIO — lote J)
 *   O  — Contas/Tributos com código de barras                  (OBRIGATÓRIO — lote ON)
 *   N  — Tributos sem código de barras (DARF, GPS, GARE etc.)  (OBRIGATÓRIO — lote ON)
 *   B  — Informações complementares do Segmento A (PIX chave) (OPCIONAL)
 *
 * Particularidades BB em relação ao padrão FEBRABAN:
 *   - CONVENIO (pos 33-52) dividido em BB1(33-41) + BB2(42-45='0126') + BB3(46-50) + BB4(51-52)
 *   - MENSAGEM_BB (pos 103-142 do Header Lote) é uso exclusivo do BB
 *   - Câmara (pos 18-20 seg A): 018=TED, 700=DOC, 009=PIX
 *   - SEU_NUMERO (pos 74-93 seg A): 74-79 aparece no extrato do favorecido,
 *     80-85 no extrato do pagador
 */
public class BB240PagamentoLayout {

    // ── Header de Arquivo (tipo 0) ────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_ARQUIVO = List.of(
            new BankLayoutField("0", "CODIGO_BANCO",       1,   3),   // '001'
            new BankLayoutField("0", "CODIGO_LOTE",        4,   7),   // '0000'
            new BankLayoutField("0", "TIPO_REGISTRO",      8,   8),   // '0'
            new BankLayoutField("0", "TIPO_INSCRICAO",     18,  18),  // 1=CPF 2=CNPJ
            new BankLayoutField("0", "INSCRICAO_EMPRESA",  19,  32),
            // Convênio BB — subdividido em BB1+BB2+BB3+BB4
            new BankLayoutField("0", "CONVENIO_BB1",       33,  41),  // nº convênio
            new BankLayoutField("0", "CONVENIO_BB2",       42,  45),  // '0126'
            new BankLayoutField("0", "CONVENIO_BB3",       46,  50),  // brancos
            new BankLayoutField("0", "CONVENIO_BB4",       51,  52),  // prod=brancos, teste='TS'
            new BankLayoutField("0", "AGENCIA",            53,  57),
            new BankLayoutField("0", "DV_AGENCIA",         58,  58),
            new BankLayoutField("0", "CONTA",              59,  70),
            new BankLayoutField("0", "DV_CONTA",           71,  71),
            new BankLayoutField("0", "DV_AG_CONTA",        72,  72),  // '0'
            new BankLayoutField("0", "NOME_EMPRESA",       73,  102),
            new BankLayoutField("0", "NOME_BANCO",         103, 132), // 'BANCO DO BRASIL SA'
            new BankLayoutField("0", "ARQUIVO_CODIGO",     143, 143), // 1=remessa 2=retorno
            new BankLayoutField("0", "DATA_GERACAO",       144, 151), // DDMMAAAA
            new BankLayoutField("0", "HORA_GERACAO",       152, 157), // HHMMSS
            new BankLayoutField("0", "NUM_SEQ_ARQUIVO",    158, 163),
            new BankLayoutField("0", "VERSAO_LAYOUT",      164, 166),
            new BankLayoutField("0", "DENSIDADE",          167, 171), // '00000'
            new BankLayoutField("0", "RESERVADO_BANCO",    172, 191), // retorno: status
            new BankLayoutField("0", "RESERVADO_EMPRESA",  192, 211),
            new BankLayoutField("0", "OCORRENCIAS",        231, 240)  // '0000000000'
    );

    // ── Header de Lote AB — Fornecedor/Salário/Diversos (tipo 1) ─────────
    // Cobre segmentos A (e B opcional): CC, poupança, TED, DOC, PIX
    private static final List<BankLayoutField> HEADER_LOTE = List.of(
            new BankLayoutField("1", "CODIGO_BANCO",       1,   3),   // '001'
            new BankLayoutField("1", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("1", "TIPO_REGISTRO",      8,   8),   // '1'
            new BankLayoutField("1", "TIPO_OPERACAO",      9,   9),   // 'C'
            new BankLayoutField("1", "TIPO_SERVICO",       10,  11),  // 20=fornecedor 30=salário 98=diversos
            new BankLayoutField("1", "FORMA_LANCAMENTO",   12,  13),  // 01=CC 05=poup 41=TED out 43=TED mesma 45=PIX 47=PIX QR
            new BankLayoutField("1", "VERSAO_LOTE",        14,  16),
            new BankLayoutField("1", "TIPO_INSCRICAO",     18,  18),
            new BankLayoutField("1", "INSCRICAO_EMPRESA",  19,  32),
            new BankLayoutField("1", "CONVENIO_BB1",       33,  41),
            new BankLayoutField("1", "CONVENIO_BB2",       42,  45),  // '0126'
            new BankLayoutField("1", "CONVENIO_BB3",       46,  50),
            new BankLayoutField("1", "CONVENIO_BB4",       51,  52),
            new BankLayoutField("1", "AGENCIA",            53,  57),
            new BankLayoutField("1", "DV_AGENCIA",         58,  58),
            new BankLayoutField("1", "CONTA",              59,  70),
            new BankLayoutField("1", "DV_CONTA",           71,  71),
            new BankLayoutField("1", "DV_AG_CONTA",        72,  72),
            new BankLayoutField("1", "NOME_EMPRESA",       73,  102),
            new BankLayoutField("1", "MENSAGEM_BB",        103, 142), // uso exclusivo BB
            new BankLayoutField("1", "LOGRADOURO",         143, 172),
            new BankLayoutField("1", "NUMERO_LOCAL",       173, 177),
            new BankLayoutField("1", "COMPLEMENTO",        178, 192),
            new BankLayoutField("1", "CIDADE",             193, 212),
            new BankLayoutField("1", "CEP",                213, 217),
            new BankLayoutField("1", "COMPLEMENTO_CEP",    218, 220),
            new BankLayoutField("1", "ESTADO",             221, 222),
            new BankLayoutField("1", "OCORRENCIAS",        231, 240)
    );

    // ── Detalhe Segmento A (tipo 3, seg A) — OBRIGATÓRIO ─────────────────
    // Crédito em CC, Poupança, TED, DOC, PIX Transferência/QR-Code
    private static final List<BankLayoutField> DETALHE_A = List.of(
            new BankLayoutField("3A", "CODIGO_BANCO",         1,   3),
            new BankLayoutField("3A", "CODIGO_LOTE",          4,   7),
            new BankLayoutField("3A", "TIPO_REGISTRO",        8,   8),
            new BankLayoutField("3A", "NUM_REGISTRO",         9,   13),
            new BankLayoutField("3A", "SEGMENTO",             14,  14),  // 'A'
            new BankLayoutField("3A", "TIPO_MOVIMENTO",       15,  15),  // 0=inclusão 9=exclusão
            new BankLayoutField("3A", "COD_INSTRUCAO",        16,  17),  // 00=inclusão 99=exclusão
            // Câmara: 018=TED/STR, 700=DOC/COMPE, 009=PIX/SPI
            new BankLayoutField("3A", "CAMARA",               18,  20),
            new BankLayoutField("3A", "BANCO_FAVORECIDO",     21,  23),
            new BankLayoutField("3A", "AGENCIA_FAV",          24,  28),
            new BankLayoutField("3A", "DV_AGENCIA_FAV",       29,  29),
            new BankLayoutField("3A", "CONTA_FAV",            30,  41),
            new BankLayoutField("3A", "DV_CONTA_FAV",         42,  42),
            new BankLayoutField("3A", "DV_AG_CONTA_FAV",      43,  43),
            new BankLayoutField("3A", "NOME_FAVORECIDO",      44,  73),
            // SEU_NUMERO: 74-79 aparece no extrato do favorecido; 80-85 no extrato do pagador
            new BankLayoutField("3A", "SEU_NUMERO",           74,  93),
            new BankLayoutField("3A", "DATA_PAGTO",           94,  101),
            new BankLayoutField("3A", "TIPO_MOEDA",           102, 104), // 'BRL'
            new BankLayoutField("3A", "VALOR_PAGTO",          120, 134), // 13V2
            new BankLayoutField("3A", "NOSSO_NUMERO",         135, 149), // retorno
            new BankLayoutField("3A", "DATA_EFETIVA",         155, 162), // retorno
            new BankLayoutField("3A", "VALOR_EFETIVO",        163, 177), // retorno
            new BankLayoutField("3A", "FINALIDADE_DETALHE",   178, 197),
            new BankLayoutField("3A", "N_INSCRICAO_FAV",      204, 217),
            new BankLayoutField("3A", "FINALIDADE_DOC",       218, 219),
            new BankLayoutField("3A", "FINALIDADE_TED",       220, 224),
            new BankLayoutField("3A", "AVISO_FAVORECIDO",     230, 230),
            new BankLayoutField("3A", "OCORRENCIAS",          231, 240)
    );

    // ── Detalhe Segmento B (tipo 3, seg B) — OPCIONAL ────────────────────
    // Informações complementares: endereço do favorecido ou chave PIX
    private static final List<BankLayoutField> DETALHE_B = List.of(
            new BankLayoutField("3B", "CODIGO_BANCO",         1,   3),
            new BankLayoutField("3B", "CODIGO_LOTE",          4,   7),
            new BankLayoutField("3B", "TIPO_REGISTRO",        8,   8),
            new BankLayoutField("3B", "NUM_REGISTRO",         9,   13),
            new BankLayoutField("3B", "SEGMENTO",             14,  14),  // 'B'
            new BankLayoutField("3B", "TIPO_INSCRICAO_FAV",   15,  15),  // 1=CPF 2=CNPJ
            new BankLayoutField("3B", "INSCRICAO_FAVORECIDO", 16,  29),
            new BankLayoutField("3B", "LOGRADOURO_FAV",       30,  64),
            new BankLayoutField("3B", "NUMERO_FAV",           65,  69),
            new BankLayoutField("3B", "COMPLEMENTO_FAV",      70,  84),
            new BankLayoutField("3B", "BAIRRO_FAV",           85,  99),
            new BankLayoutField("3B", "CIDADE_FAV",           100, 119),
            new BankLayoutField("3B", "CEP_FAV",              120, 124),
            new BankLayoutField("3B", "COMPLEMENTO_CEP_FAV",  125, 127),
            new BankLayoutField("3B", "ESTADO_FAV",           128, 129),
            // PIX: tipo chave (001=telefone 002=email 003=CPF/CNPJ 004=aleatória 005=dados bancários)
            new BankLayoutField("3B", "TIPO_CHAVE_PIX",       130, 132),
            new BankLayoutField("3B", "CHAVE_PIX",            133, 177),
            new BankLayoutField("3B", "IDENTIFICACAO_PAGTO",  178, 217),
            new BankLayoutField("3B", "DATA_VENCIMENTO_PIX",  218, 225),
            new BankLayoutField("3B", "VALOR_PIX",            226, 240)
    );

    // ── Detalhe Segmento J (tipo 3, seg J) — OBRIGATÓRIO ─────────────────
    // Pagamento de Boletos: Banco do Brasil (forma 30) e outros bancos (forma 31)
    private static final List<BankLayoutField> DETALHE_J = List.of(
            new BankLayoutField("3J", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3J", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3J", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3J", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3J", "SEGMENTO",           14,  14),  // 'J'
            new BankLayoutField("3J", "TIPO_MOVIMENTO",     15,  15),
            new BankLayoutField("3J", "COD_INSTRUCAO",      16,  17),
            new BankLayoutField("3J", "COD_BARRAS",         18,  61),  // 44 pos
            new BankLayoutField("3J", "NOME_CEDENTE",       62,  91),
            new BankLayoutField("3J", "DATA_VENCIMENTO",    92,  99),
            new BankLayoutField("3J", "VALOR_TITULO",       100, 114), // 13V2
            new BankLayoutField("3J", "DESCONTO",           115, 129), // 13V2
            new BankLayoutField("3J", "ACRESCIMO",          130, 144), // 13V2
            new BankLayoutField("3J", "DATA_PAGTO",         145, 152),
            new BankLayoutField("3J", "VALOR_PAGTO",        153, 167), // 13V2
            new BankLayoutField("3J", "QTD MOEDA",         168, 182),
            new BankLayoutField("3J", "NOSSO_NUMERO",         183, 202),
            new BankLayoutField("3J", "NOSSO_NUMERO (BCO)", 203, 222), 
            new BankLayoutField("3J", "COD_MOEDA",       223, 224), 
            new BankLayoutField("3J", "CNAB",          225, 230),
            new BankLayoutField("3J", "OCORRENCIAS",        231, 240)
    );

    // ── Detalhe Segmento O (tipo 3, seg O) — OBRIGATÓRIO ─────────────────
    // Contas e tributos com código de barras (forma lançamento '11')
    private static final List<BankLayoutField> DETALHE_O = List.of(
            new BankLayoutField("3O", "CODIGO_BANCO",         1,   3),
            new BankLayoutField("3O", "CODIGO_LOTE",          4,   7),
            new BankLayoutField("3O", "TIPO_REGISTRO",        8,   8),
            new BankLayoutField("3O", "NUM_REGISTRO",         9,   13),
            new BankLayoutField("3O", "SEGMENTO",             14,  14),  // 'O'
            new BankLayoutField("3O", "TIPO_MOVIMENTO",       15,  15),
            new BankLayoutField("3O", "COD_INSTRUCAO",        16,  17),
            new BankLayoutField("3O", "COD_BARRAS",           18,  61),
            new BankLayoutField("3O", "NOME_CONCESSIONARIA",  62,  91),
            new BankLayoutField("3O", "DATA_VENCIMENTO",      92,  99),
            new BankLayoutField("3O", "VALOR_PAGTO",          100, 114),
            new BankLayoutField("3O", "SEU_NUMERO",           115, 134),
            new BankLayoutField("3O", "NOSSO_NUMERO",         135, 149), // retorno
            new BankLayoutField("3O", "DATA_PAGTO",           145, 152),
            new BankLayoutField("3O", "DATA_CREDITO",         153, 160), // retorno
            new BankLayoutField("3O", "VALOR_EFETIVO",        161, 175), // retorno
            new BankLayoutField("3O", "AVISO_FAVORECIDO",     230, 230),
            new BankLayoutField("3O", "OCORRENCIAS",          231, 240)
    );

    // ── Detalhe Segmento N (tipo 3, seg N) — OBRIGATÓRIO ─────────────────
    // Tributos sem código de barras: DARF Normal(16), GPS(17), DARF Simples(18),
    // DARJ(21), GARE SP ICMS(22), GARE SP DR(23), GARE SP ITCMD(24)
    private static final List<BankLayoutField> DETALHE_N = List.of(
            new BankLayoutField("3N", "CODIGO_BANCO",         1,   3),
            new BankLayoutField("3N", "CODIGO_LOTE",          4,   7),
            new BankLayoutField("3N", "TIPO_REGISTRO",        8,   8),
            new BankLayoutField("3N", "NUM_REGISTRO",         9,   13),
            new BankLayoutField("3N", "SEGMENTO",             14,  14),  // 'N'
            new BankLayoutField("3N", "TIPO_MOVIMENTO",       15,  15),
            new BankLayoutField("3N", "COD_INSTRUCAO",        16,  17),
            new BankLayoutField("3N", "COD_RECEITA",          18,  21),  // código do tributo
            new BankLayoutField("3N", "TIPO_INSCRICAO_CONTRIB", 22, 22),
            new BankLayoutField("3N", "INSCRICAO_CONTRIBUINTE", 23, 36),
            new BankLayoutField("3N", "COD_PAGAMENTO",        37,  52),  // ref ou competência
            new BankLayoutField("3N", "VENCIMENTO",           53,  60),  // DDMMAAAA
            new BankLayoutField("3N", "VALOR_PRINCIPAL",      61,  75),  // 13V2
            new BankLayoutField("3N", "MULTA",                76,  90),  // 13V2
            new BankLayoutField("3N", "JUROS",                91,  105), // 13V2
            new BankLayoutField("3N", "DATA_PAGTO",           106, 113),
            new BankLayoutField("3N", "VALOR_PAGTO",          114, 128), // 13V2
            new BankLayoutField("3N", "SEU_NUMERO",           129, 142),
            new BankLayoutField("3N", "NOSSO_NUMERO",         143, 157), // retorno
            new BankLayoutField("3N", "PERIODO_APURACAO",     158, 165),
            new BankLayoutField("3N", "NUM_REFERENCIA",       166, 178),
            new BankLayoutField("3N", "VALOR_RECEITA",        179, 193),
            new BankLayoutField("3N", "TIPO_PAGAMENTO",       194, 194),
            new BankLayoutField("3N", "AVISO_FAVORECIDO",     230, 230),
            new BankLayoutField("3N", "OCORRENCIAS",          231, 240)
    );

    // ── Trailer de Lote (tipo 5) ──────────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_LOTE = List.of(
            new BankLayoutField("5", "CODIGO_BANCO",    1,   3),
            new BankLayoutField("5", "CODIGO_LOTE",     4,   7),
            new BankLayoutField("5", "TIPO_REGISTRO",   8,   8),   // '5'
            new BankLayoutField("5", "QTD_REGISTROS",   18,  23),
            new BankLayoutField("5", "SOMA_VALORES",    24,  41),  // 16V2
            new BankLayoutField("5", "QTD_MOEDAS",      42,  59),
            new BankLayoutField("5", "OCORRENCIAS",     231, 240)
    );

    // ── Trailer de Arquivo (tipo 9) ───────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_ARQUIVO = List.of(
            new BankLayoutField("9", "CODIGO_BANCO",    1,  3),
            new BankLayoutField("9", "CODIGO_LOTE",     4,  7),
            new BankLayoutField("9", "TIPO_REGISTRO",   8,  8),   // '9'
            new BankLayoutField("9", "QTD_LOTES",       18, 23),
            new BankLayoutField("9", "QTD_REGISTROS",   24, 29),
            new BankLayoutField("9", "QTD_CONTAS",      30, 35)
    );

    // ── Mapa principal ────────────────────────────────────────────────────
    private static final Map<String, List<BankLayoutField>> FIELDS_BY_RECORD_TYPE =
            Map.of(
                    "0", HEADER_ARQUIVO,
                    "1", HEADER_LOTE,
                    "3A", DETALHE_A,
                    "3B", DETALHE_B,
                    "3J", DETALHE_J,
                    "3O", DETALHE_O,
                    "3N", DETALHE_N,
                    "5", TRAILER_LOTE,
                    "9", TRAILER_ARQUIVO
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

            char segmento = line.charAt(13);

            if (segmento == 'J') {
                String complemento = safeSubstring(line, 17, 19).trim(); // pos 18-19
                if ("52".equals(complemento)) {
                    return "3J52";
                }
            }

            return "3" + segmento;
        }

        return String.valueOf(tipo);
    }

    private static String safeSubstring(String line, int beginInclusive, int endExclusive) {
        if (line == null) return "";
        if (beginInclusive >= line.length()) return "";
        return line.substring(beginInclusive, Math.min(endExclusive, line.length()));
    }
}