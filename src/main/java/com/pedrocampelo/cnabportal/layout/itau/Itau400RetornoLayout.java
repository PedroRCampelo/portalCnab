package com.pedrocampelo.cnabportal.layout.itau;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;
import java.util.*;

public class Itau400RetornoLayout {

    // Tipo "0" → HEADER
    private static final List<BankLayoutField> HEADER = List.of(
            new BankLayoutField("0", "TIPO_REGISTRO",        1,   1),
            new BankLayoutField("0", "CODIGO_RETORNO",       2,   2),
            new BankLayoutField("0", "LITERAL_RETORNO",      3,   9),
            new BankLayoutField("0", "CODIGO_SERVICO",       10,  11),
            new BankLayoutField("0", "LITERAL_SERVICO",      12,  26),
            new BankLayoutField("0", "AGENCIA",              27,  30),
            new BankLayoutField("0", "CONTA",                33,  37),
            new BankLayoutField("0", "DAC",                  38,  38),
            new BankLayoutField("0", "NOME_EMPRESA",         47,  76),
            new BankLayoutField("0", "CODIGO_BANCO",         77,  79),
            new BankLayoutField("0", "NOME_BANCO",           80,  94),
            new BankLayoutField("0", "DATA_GERACAO",         95,  100),
            new BankLayoutField("0", "NUM_SEQ_ARQ_RET",      109, 113),
            new BankLayoutField("0", "DATA_CREDITO",         114, 119),
            new BankLayoutField("0", "NUMERO_SEQUENCIAL",    395, 400)
    );

    // Tipo "1" → DETALHE
    private static final List<BankLayoutField> DETALHE = List.of(
            new BankLayoutField("1", "TIPO_REGISTRO",        1,   1),
            new BankLayoutField("1", "CODIGO_INSCRICAO",     2,   3),
            new BankLayoutField("1", "NUMERO_INSCRICAO",     4,   17),
            new BankLayoutField("1", "AGENCIA",              18,  21),
            new BankLayoutField("1", "CONTA",                24,  28),
            new BankLayoutField("1", "DAC",                  29,  29),
            new BankLayoutField("1", "USO_EMPRESA",          38,  62),
            new BankLayoutField("1", "NOSSO_NUMERO",         63,  70),
            new BankLayoutField("1", "CARTEIRA_NUM",         83,  85),
            new BankLayoutField("1", "NOSSO_NUMERO_2",       86,  93),
            new BankLayoutField("1", "DAC_NOSSO_NUMERO",     94,  94),
            new BankLayoutField("1", "CARTEIRA",             108, 108),
            new BankLayoutField("1", "COD_OCORRENCIA",       109, 110),
            new BankLayoutField("1", "DATA_OCORRENCIA",      111, 116),
            new BankLayoutField("1", "NUM_DOCUMENTO",        117, 126),
            new BankLayoutField("1", "NOSSO_NUMERO_CONF",    127, 134),
            new BankLayoutField("1", "VENCIMENTO",           147, 152),
            new BankLayoutField("1", "VALOR_TITULO",         153, 165),
            new BankLayoutField("1", "CODIGO_BANCO",         166, 168),
            new BankLayoutField("1", "AGENCIA_COBRADORA",    169, 172),
            new BankLayoutField("1", "ESPECIE",              174, 175),
            new BankLayoutField("1", "TARIFA_COBRANCA",      176, 188),
            new BankLayoutField("1", "VALOR_IOF",            215, 227),
            new BankLayoutField("1", "VALOR_ABATIMENTO",     228, 240),
            new BankLayoutField("1", "DESCONTOS",            241, 253),
            new BankLayoutField("1", "VALOR_PRINCIPAL",      254, 266),
            new BankLayoutField("1", "JUROS_MORA_MULTA",     267, 279),
            new BankLayoutField("1", "OUTROS_CREDITOS",      280, 292),
            new BankLayoutField("1", "BOLETO_DDA",           293, 293),
            new BankLayoutField("1", "DATA_CREDITO",         296, 301),
            new BankLayoutField("1", "INSTR_CANCELADA",      302, 305),
            new BankLayoutField("1", "NOME_PAGADOR",         325, 354),
            new BankLayoutField("1", "ERROS_MENSAGEM",       378, 385),
            new BankLayoutField("1", "COD_LIQUIDACAO",       393, 394),
            new BankLayoutField("1", "NUMERO_SEQUENCIAL",    395, 400)
    );

    // Tipo "9" → TRAILER
    private static final List<BankLayoutField> TRAILER = List.of(
            new BankLayoutField("9", "TIPO_REGISTRO",         1,   1),
            new BankLayoutField("9", "CODIGO_RETORNO",        2,   2),
            new BankLayoutField("9", "CODIGO_SERVICO",        3,   4),
            new BankLayoutField("9", "CODIGO_BANCO",          5,   7),
            new BankLayoutField("9", "QTDE_TITULOS_SIMPLES",  18,  25),
            new BankLayoutField("9", "VALOR_TOTAL_SIMPLES",   26,  39),
            new BankLayoutField("9", "QTDE_TITULOS_VINC",     58,  65),
            new BankLayoutField("9", "VALOR_TOTAL_VINC",      66,  79),
            new BankLayoutField("9", "QTDE_TITULOS_DIRETA",   178, 185),
            new BankLayoutField("9", "VALOR_TOTAL_DIRETA",    186, 199),
            new BankLayoutField("9", "CONTROLE_ARQUIVO",      208, 212),
            new BankLayoutField("9", "QTDE_DETALHES",         213, 220),
            new BankLayoutField("9", "VLR_TOTAL_INFORMADO",   221, 234),
            new BankLayoutField("9", "NUMERO_SEQUENCIAL",     395, 400)
    );

    private static final Map<String, List<BankLayoutField>> LAYOUT_BY_TYPE = Map.of(
            "0", HEADER,
            "1", DETALHE,
            "9", TRAILER
    );

    public static List<BankLayoutField> getFieldsForLine(String line) {
        if (line == null || line.isEmpty()) return Collections.emptyList();
        return LAYOUT_BY_TYPE.getOrDefault(String.valueOf(line.charAt(0)), Collections.emptyList());
    }
}