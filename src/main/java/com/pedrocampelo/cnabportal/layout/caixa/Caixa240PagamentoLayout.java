package com.pedrocampelo.cnabportal.layout.caixa;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Layout Caixa Econômica Federal — CNAB 240 Pagamentos.
 * Baseado no Manual Operacional v021 (setembro/2018).
 *
 * Banco: 104 — Caixa Econômica Federal
 *
 * Particularidades da Caixa em relação ao padrão FEBRABAN:
 *  - Código do Convênio (pos 33-38) = 6 posições (diferente do BB que usa 20)
 *  - Parâmetro de Transmissão (pos 39-40) e Ambiente (pos 41-42) no header
 *  - Conta com Operação: pos 059-062 = operação (4 pos), 063-070 = conta (8 pos)
 *  - Segmento B é OBRIGATÓRIO junto com A (complemento TED/DOC/Crédito)
 *  - Câmara: "018"=TED, "700"=DOC/OP, "000"=Crédito em Conta, "888"=ISPB
 *  - Segmento W: exclusivo FGTS (convênio 0181)
 *
 * Tipo de registro (pos 8, index 7):
 *   0 = Header de Arquivo
 *   1 = Header de Lote
 *   3 = Detalhe → Segmento (pos 14, index 13)
 *   5 = Trailer de Lote
 *   9 = Trailer de Arquivo
 */
public class Caixa240PagamentoLayout {

    // ── Header de Arquivo (tipo 0) ────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_ARQUIVO = List.of(
            new BankLayoutField("0", "CODIGO_BANCO",       1,   3),   // '104'
            new BankLayoutField("0", "CODIGO_LOTE",        4,   7),   // '0000'
            new BankLayoutField("0", "TIPO_REGISTRO",      8,   8),   // '0'
            new BankLayoutField("0", "TIPO_INSCRICAO",     18,  18),  // 1=CPF 2=CNPJ
            new BankLayoutField("0", "INSCRICAO_EMPRESA",  19,  32),
            // Convênio Caixa: 6 posições (diferente BB=20)
            new BankLayoutField("0", "CODIGO_CONVENIO",    33,  38),
            new BankLayoutField("0", "PARAM_TRANSMISSAO",  39,  40),
            new BankLayoutField("0", "AMBIENTE_CLIENTE",   41,  41),  // T=teste P=produção
            new BankLayoutField("0", "AMBIENTE_CAIXA",     42,  42),
            new BankLayoutField("0", "ORIGEM_APLICATIVO",  43,  45),
            new BankLayoutField("0", "VERSAO_NUMERO",      46,  49),
            new BankLayoutField("0", "AGENCIA",            53,  57),
            new BankLayoutField("0", "DV_AGENCIA",         58,  58),
            new BankLayoutField("0", "CONTA",              59,  70),  // 059-062=operação 063-070=conta
            new BankLayoutField("0", "DV_CONTA",           71,  71),
            new BankLayoutField("0", "DV_AG_CONTA",        72,  72),
            new BankLayoutField("0", "NOME_EMPRESA",       73,  102),
            new BankLayoutField("0", "NOME_BANCO",         103, 132), // 'CAIXA'
            new BankLayoutField("0", "ARQUIVO_CODIGO",     143, 143), // 1=remessa 2=retorno
            new BankLayoutField("0", "DATA_GERACAO",       144, 151), // DDMMAAAA
            new BankLayoutField("0", "HORA_GERACAO",       152, 157), // HHMMSS
            new BankLayoutField("0", "NSA",                158, 163), // número sequencial arquivo
            new BankLayoutField("0", "VERSAO_LAYOUT",      164, 166), // '080'
            new BankLayoutField("0", "DENSIDADE",          167, 171), // '01600'
            new BankLayoutField("0", "RESERVADO_BANCO",    172, 191),
            new BankLayoutField("0", "RESERVADO_EMPRESA",  192, 211),
            new BankLayoutField("0", "OCORRENCIAS",        231, 240)
    );

    // ── Header de Lote (tipo 1) ───────────────────────────────────────────
    private static final List<BankLayoutField> HEADER_LOTE = List.of(
            new BankLayoutField("1", "CODIGO_BANCO",       1,   3),   // '104'
            new BankLayoutField("1", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("1", "TIPO_REGISTRO",      8,   8),   // '1'
            new BankLayoutField("1", "TIPO_OPERACAO",      9,   9),   // C=crédito D=débito
            new BankLayoutField("1", "TIPO_SERVICO",       10,  11),
            new BankLayoutField("1", "FORMA_LANCAMENTO",   12,  13),
            new BankLayoutField("1", "VERSAO_LOTE",        14,  16),  // '041'
            new BankLayoutField("1", "TIPO_INSCRICAO",     18,  18),
            new BankLayoutField("1", "INSCRICAO_EMPRESA",  19,  32),
            new BankLayoutField("1", "CODIGO_CONVENIO",    33,  38),
            new BankLayoutField("1", "TIPO_COMPROMISSO",   39,  40),  // 01=fornec 02=salário 03=autopag
            new BankLayoutField("1", "CODIGO_COMPROMISSO", 41,  44),
            new BankLayoutField("1", "PARAM_TRANSMISSAO",  45,  46),
            new BankLayoutField("1", "AGENCIA",            53,  57),
            new BankLayoutField("1", "DV_AGENCIA",         58,  58),
            new BankLayoutField("1", "CONTA",              59,  70),
            new BankLayoutField("1", "DV_CONTA",           71,  71),
            new BankLayoutField("1", "DV_AG_CONTA",        72,  72),
            new BankLayoutField("1", "NOME_EMPRESA",       73,  102),
            new BankLayoutField("1", "MENSAGEM_AVISO_1",   103, 142),
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
    // Crédito em Conta, DOC, OP, TED, Débito em Conta
    // Câmara: 018=TED, 700=DOC/OP, 000=Crédito em Conta, 888=ISPB
    private static final List<BankLayoutField> DETALHE_A = List.of(
            new BankLayoutField("3A", "CODIGO_BANCO",           1,   3),
            new BankLayoutField("3A", "CODIGO_LOTE",            4,   7),
            new BankLayoutField("3A", "TIPO_REGISTRO",          8,   8),
            new BankLayoutField("3A", "NUM_REGISTRO",           9,   13),
            new BankLayoutField("3A", "SEGMENTO",               14,  14), // 'A'
            new BankLayoutField("3A", "TIPO_MOVIMENTO",         15,  15), // 0=inclusão 9=exclusão
            new BankLayoutField("3A", "COD_INSTRUCAO",          16,  17), // '00'
            // Câmara: 018=TED 700=DOC/OP 000=CC 888=ISPB
            new BankLayoutField("3A", "CAMARA",                 18,  20),
            new BankLayoutField("3A", "BANCO_FAVORECIDO",       21,  23),
            new BankLayoutField("3A", "AGENCIA_FAV",            24,  28),
            new BankLayoutField("3A", "DV_AGENCIA_FAV",         29,  29),
            // Conta Caixa: 030-033=operação, 034-041=conta; outros bancos: número completo
            new BankLayoutField("3A", "CONTA_FAV",              30,  41),
            new BankLayoutField("3A", "DV_CONTA_FAV",           42,  42),
            new BankLayoutField("3A", "DV_AG_CONTA_FAV",        43,  43),
            new BankLayoutField("3A", "NOME_FAVORECIDO",        44,  73),
            // Número documento atribuído pela empresa (obrigatório, evoluir de 1 em 1)
            new BankLayoutField("3A", "NUM_DOC_EMPRESA",        74,  79),
            new BankLayoutField("3A", "TIPO_CONTA_TED",         93,  93), // 0=sem conta 1=CC 2=poupança
            new BankLayoutField("3A", "DATA_PAGTO",             94,  101),
            new BankLayoutField("3A", "TIPO_MOEDA",             102, 104), // BRL/USD/UFR/TRD
            new BankLayoutField("3A", "QTDE_MOEDA",             105, 119),
            new BankLayoutField("3A", "VALOR_PAGTO",            120, 134), // 13V2
            new BankLayoutField("3A", "NOSSO_NUMERO",           135, 143), // retorno (9 pos)
            new BankLayoutField("3A", "DATA_EFETIVA",           155, 162), // retorno
            new BankLayoutField("3A", "VALOR_EFETIVO",          163, 177), // retorno 13V2
            new BankLayoutField("3A", "INFORMACAO_2",           178, 217), // msg ao favorecido
            new BankLayoutField("3A", "FINALIDADE_DOC",         218, 219),
            new BankLayoutField("3A", "AVISO_FAVORECIDO",       230, 230),
            new BankLayoutField("3A", "OCORRENCIAS",            231, 240)
    );

    // ── Detalhe Segmento B (tipo 3, seg B) — OBRIGATÓRIO (complemento A) ─
    // Endereço do favorecido ou informações PIX/TED Judicial
    private static final List<BankLayoutField> DETALHE_B = List.of(
            new BankLayoutField("3B", "CODIGO_BANCO",           1,   3),
            new BankLayoutField("3B", "CODIGO_LOTE",            4,   7),
            new BankLayoutField("3B", "TIPO_REGISTRO",          8,   8),
            new BankLayoutField("3B", "NUM_REGISTRO",           9,   13),
            new BankLayoutField("3B", "SEGMENTO",               14,  14), // 'B'
            new BankLayoutField("3B", "TIPO_INSCRICAO_FAV",     15,  15),
            new BankLayoutField("3B", "INSCRICAO_FAVORECIDO",   16,  29),
            new BankLayoutField("3B", "LOGRADOURO_FAV",         30,  64),
            new BankLayoutField("3B", "NUMERO_FAV",             65,  69),
            new BankLayoutField("3B", "COMPLEMENTO_FAV",        70,  84),
            new BankLayoutField("3B", "BAIRRO_FAV",             85,  99),
            new BankLayoutField("3B", "CIDADE_FAV",             100, 119),
            new BankLayoutField("3B", "CEP_FAV",                120, 124),
            new BankLayoutField("3B", "COMPLEMENTO_CEP_FAV",    125, 127),
            new BankLayoutField("3B", "ESTADO_FAV",             128, 129),
            new BankLayoutField("3B", "VALOR_DOCUMENTO",        130, 144),
            new BankLayoutField("3B", "VALOR_ABATIMENTO",       145, 159),
            new BankLayoutField("3B", "VALOR_DESCONTO",         160, 174),
            new BankLayoutField("3B", "VALOR_MORA",             175, 189),
            new BankLayoutField("3B", "VALOR_MULTA",            190, 204),
            new BankLayoutField("3B", "CODIGO_DOCUMENTO_FAV",   205, 214),
            new BankLayoutField("3B", "AVISO_FAVORECIDO",       215, 215),
            new BankLayoutField("3B", "OCORRENCIAS",            231, 240)
    );

    // ── Detalhe Segmento J (tipo 3, seg J) — OBRIGATÓRIO ─────────────────
    // Pagamento de boletos CAIXA e outros bancos / PIX QR Code
    private static final List<BankLayoutField> DETALHE_J = List.of(
            new BankLayoutField("3J", "CODIGO_BANCO",       1,   3),
            new BankLayoutField("3J", "CODIGO_LOTE",        4,   7),
            new BankLayoutField("3J", "TIPO_REGISTRO",      8,   8),
            new BankLayoutField("3J", "NUM_REGISTRO",       9,   13),
            new BankLayoutField("3J", "SEGMENTO",           14,  14), // 'J'
            new BankLayoutField("3J", "TIPO_MOVIMENTO",     15,  15),
            new BankLayoutField("3J", "COD_INSTRUCAO",      16,  17),
            // J.08 banco destino (3 pos) + J.09 cód moeda (1) + J.10 campo livre (25) + DV (1) = 30 = cod barras
            new BankLayoutField("3J", "COD_BARRAS",         18,  61), // 44 posições (padrão FEBRABAN)
            new BankLayoutField("3J", "NOME_CEDENTE",       62,  91),
            new BankLayoutField("3J", "DATA_VENCIMENTO",    92,  99),
            new BankLayoutField("3J", "VALOR_TITULO",       100, 114), // 13V2
            new BankLayoutField("3J", "DESCONTO",           115, 129), // 13V2
            new BankLayoutField("3J", "ACRESCIMO",          130, 144), // 13V2
            new BankLayoutField("3J", "DATA_PAGTO",         145, 152),
            new BankLayoutField("3J", "VALOR_PAGTO",        153, 167), // 13V2
            new BankLayoutField("3J", "SEU_NUMERO",         168, 187),
            new BankLayoutField("3J", "NOSSO_NUMERO",       188, 202), // retorno
            new BankLayoutField("3J", "COD_MOEDA",          203, 204),
            new BankLayoutField("3J", "DATA_CREDITO",       205, 212), // retorno
            new BankLayoutField("3J", "AVISO_FAVORECIDO",   230, 230),
            new BankLayoutField("3J", "OCORRENCIAS",        231, 240)
    );

    // ── Detalhe Segmento O (tipo 3, seg O) — OBRIGATÓRIO ─────────────────
    // Contas e tributos com código de barras (concessionárias)
    private static final List<BankLayoutField> DETALHE_O = List.of(
            new BankLayoutField("3O", "CODIGO_BANCO",         1,   3),
            new BankLayoutField("3O", "CODIGO_LOTE",          4,   7),
            new BankLayoutField("3O", "TIPO_REGISTRO",        8,   8),
            new BankLayoutField("3O", "NUM_REGISTRO",         9,   13),
            new BankLayoutField("3O", "SEGMENTO",             14,  14), // 'O'
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
            // CPF/CNPJ favorecido (obrigatório para FUNDEB/FNDE/Saúde)
            new BankLayoutField("3O", "INSCRICAO_FAVORECIDO", 217, 230),
            new BankLayoutField("3O", "OCORRENCIAS",          231, 240)
    );

    // ── Detalhe Segmento N (tipo 3, seg N) — OBRIGATÓRIO ─────────────────
    // Tributos sem código de barras (GPS, DARF, GARE, etc.)
    private static final List<BankLayoutField> DETALHE_N = List.of(
            new BankLayoutField("3N", "CODIGO_BANCO",           1,   3),
            new BankLayoutField("3N", "CODIGO_LOTE",            4,   7),
            new BankLayoutField("3N", "TIPO_REGISTRO",          8,   8),
            new BankLayoutField("3N", "NUM_REGISTRO",           9,   13),
            new BankLayoutField("3N", "SEGMENTO",               14,  14), // 'N'
            new BankLayoutField("3N", "TIPO_MOVIMENTO",         15,  15),
            new BankLayoutField("3N", "COD_INSTRUCAO",          16,  17),
            new BankLayoutField("3N", "COD_RECEITA",            18,  21),
            new BankLayoutField("3N", "TIPO_INSCRICAO_CONTRIB", 22,  22),
            new BankLayoutField("3N", "INSCRICAO_CONTRIBUINTE", 23,  36),
            new BankLayoutField("3N", "COD_PAGAMENTO",          37,  52),
            new BankLayoutField("3N", "VENCIMENTO",             53,  60),
            new BankLayoutField("3N", "VALOR_PRINCIPAL",        61,  75),  // 13V2
            new BankLayoutField("3N", "MULTA",                  76,  90),  // 13V2
            new BankLayoutField("3N", "JUROS",                  91,  105), // 13V2
            new BankLayoutField("3N", "DATA_PAGTO",             106, 113),
            new BankLayoutField("3N", "VALOR_PAGTO",            114, 128), // 13V2
            new BankLayoutField("3N", "SEU_NUMERO",             129, 142),
            new BankLayoutField("3N", "NOSSO_NUMERO",           143, 157), // retorno
            new BankLayoutField("3N", "PERIODO_APURACAO",       158, 165),
            new BankLayoutField("3N", "NUM_REFERENCIA",         166, 178),
            new BankLayoutField("3N", "VALOR_RECEITA",          179, 193),
            new BankLayoutField("3N", "TIPO_PAGAMENTO",         194, 194),
            new BankLayoutField("3N", "AVISO_FAVORECIDO",       230, 230),
            new BankLayoutField("3N", "OCORRENCIAS",            231, 240)
    );

    // ── Detalhe Segmento W (tipo 3, seg W) — OPCIONAL (apenas FGTS) ──────
    // Exclusivo para pagamento de FGTS convênio 0181 (GRF Recursal/Filantrópico)
    private static final List<BankLayoutField> DETALHE_W = List.of(
            new BankLayoutField("3W", "CODIGO_BANCO",         1,   3),
            new BankLayoutField("3W", "CODIGO_LOTE",          4,   7),
            new BankLayoutField("3W", "TIPO_REGISTRO",        8,   8),
            new BankLayoutField("3W", "NUM_REGISTRO",         9,   13),
            new BankLayoutField("3W", "SEGMENTO",             14,  14), // 'W'
            new BankLayoutField("3W", "NUM_SEQ_COMPLEMENTAR", 15,  15), // '1'
            new BankLayoutField("3W", "COD_RECOLHIMENTO",     16,  18),
            new BankLayoutField("3W", "INSCRICAO_EMPRESA",    19,  32),
            new BankLayoutField("3W", "CNPJ_TOMADOR",         33,  46),
            new BankLayoutField("3W", "COMPETENCIA",          47,  52),
            new BankLayoutField("3W", "VALOR_FGTS",           53,  67),
            new BankLayoutField("3W", "VALOR_MULTA_FGTS",     68,  82),
            new BankLayoutField("3W", "VALOR_JUROS_FGTS",     83,  97),
            new BankLayoutField("3W", "VALOR_ATUALIZACAO",    98,  112),
            new BankLayoutField("3W", "OCORRENCIAS",          231, 240)
    );

    // ── Trailer de Lote (tipo 5) ──────────────────────────────────────────
    private static final List<BankLayoutField> TRAILER_LOTE = List.of(
            new BankLayoutField("5", "CODIGO_BANCO",    1,   3),
            new BankLayoutField("5", "CODIGO_LOTE",     4,   7),
            new BankLayoutField("5", "TIPO_REGISTRO",   8,   8),
            new BankLayoutField("5", "QTD_REGISTROS",   18,  23),
            new BankLayoutField("5", "SOMA_VALORES",    24,  41), // 16V2
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
                    "3B", DETALHE_B,
                    "3J", DETALHE_J,
                    "3O", DETALHE_O,
                    "3N", DETALHE_N,
                    "3W", DETALHE_W,
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