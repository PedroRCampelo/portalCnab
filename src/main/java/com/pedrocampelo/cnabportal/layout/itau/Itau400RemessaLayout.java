package com.pedrocampelo.cnabportal.layout.itau;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;
import java.util.*;

public class Itau400RemessaLayout {

    // Tipo "0" → HEADER
    private static final List<BankLayoutField> HEADER = List.of(
            new BankLayoutField("0", "TIPO_REGISTRO",    1,   1),
            new BankLayoutField("0", "OPERACAO",          2,   2),
            new BankLayoutField("0", "LITERAL_REMESSA",   3,   9),
            new BankLayoutField("0", "CODIGO_SERVICO",    10,  11),
            new BankLayoutField("0", "LITERAL_SERVICO",   12,  26),
            new BankLayoutField("0", "AGENCIA",           27,  30),
            new BankLayoutField("0", "ZEROS",             31,  32),
            new BankLayoutField("0", "CONTA",             33,  37),
            new BankLayoutField("0", "DAC",               38,  38),
            new BankLayoutField("0", "BRANCOS",           39,  46),
            new BankLayoutField("0", "NOME_EMPRESA",      47,  76),
            new BankLayoutField("0", "CODIGO_BANCO",      77,  79),
            new BankLayoutField("0", "NOME_BANCO",        80,  94),
            new BankLayoutField("0", "DATA_GERACAO",      95,  100),
            new BankLayoutField("0", "NUMERO_SEQUENCIAL", 395, 400)
    );

    // Tipo "1" → DETALHE (obrigatório)
    private static final List<BankLayoutField> DETALHE = List.of(
            new BankLayoutField("1", "TIPO_REGISTRO",      1,   1),
            new BankLayoutField("1", "CODIGO_INSCRICAO",   2,   3),
            new BankLayoutField("1", "NUMERO_INSCRICAO",   4,   17),
            new BankLayoutField("1", "AGENCIA",            18,  21),
            new BankLayoutField("1", "ZEROS",              22,  23),
            new BankLayoutField("1", "CONTA",              24,  28),
            new BankLayoutField("1", "DAC",                29,  29),
            new BankLayoutField("1", "INSTRUCAO_ALEGACAO", 34,  37),
            new BankLayoutField("1", "USO_EMPRESA",        38,  62),
            new BankLayoutField("1", "NOSSO_NUMERO",       63,  70),
            new BankLayoutField("1", "QTDE_MOEDA",         71,  83),
            new BankLayoutField("1", "NUM_CARTEIRA",       84,  86),
            new BankLayoutField("1", "CARTEIRA",           108, 108),
            new BankLayoutField("1", "COD_OCORRENCIA",     109, 110),
            new BankLayoutField("1", "NUM_DOCUMENTO",      111, 120),
            new BankLayoutField("1", "VENCIMENTO",         121, 126),
            new BankLayoutField("1", "VALOR_TITULO",       127, 139),
            new BankLayoutField("1", "CODIGO_BANCO",       140, 142),
            new BankLayoutField("1", "AGENCIA_COBRADORA",  143, 147),
            new BankLayoutField("1", "ESPECIE",            148, 149),
            new BankLayoutField("1", "ACEITE",             150, 150),
            new BankLayoutField("1", "DATA_EMISSAO",       151, 156),
            new BankLayoutField("1", "INSTRUCAO_1",        157, 158),
            new BankLayoutField("1", "INSTRUCAO_2",        159, 160),
            new BankLayoutField("1", "JUROS_1_DIA",        161, 173),
            new BankLayoutField("1", "DESCONTO_ATE",       174, 179),
            new BankLayoutField("1", "VALOR_DESCONTO",     180, 192),
            new BankLayoutField("1", "VALOR_IOF",          193, 205),
            new BankLayoutField("1", "ABATIMENTO",         206, 218),
            new BankLayoutField("1", "COD_INSCRICAO_PAG",  219, 220),
            new BankLayoutField("1", "NUM_INSCRICAO_PAG",  221, 234),
            new BankLayoutField("1", "NOME_PAGADOR",       235, 264),
            new BankLayoutField("1", "LOGRADOURO",         275, 314),
            new BankLayoutField("1", "BAIRRO",             315, 326),
            new BankLayoutField("1", "CEP",                327, 334),
            new BankLayoutField("1", "CIDADE",             335, 349),
            new BankLayoutField("1", "ESTADO",             350, 351),
            new BankLayoutField("1", "SACADOR_AVALISTA",   352, 381),
            new BankLayoutField("1", "DATA_MORA",          386, 391),
            new BankLayoutField("1", "PRAZO",              392, 393),
            new BankLayoutField("1", "NUMERO_SEQUENCIAL",  395, 400)
    );

    // Tipo "2" → DETALHE MULTA (opcional)
    private static final List<BankLayoutField> DETALHE_MULTA = List.of(
            new BankLayoutField("2", "TIPO_REGISTRO",     1,   1),
            new BankLayoutField("2", "COD_MULTA",         2,   2),
            new BankLayoutField("2", "DATA_MULTA",        3,   10),
            new BankLayoutField("2", "MULTA",             11,  23),
            new BankLayoutField("2", "NUMERO_SEQUENCIAL", 395, 400)
    );

    // Tipo "4" → DETALHE RATEIO (opcional)
    private static final List<BankLayoutField> DETALHE_RATEIO = List.of(
            new BankLayoutField("4", "TIPO_REGISTRO",     1,   1),
            new BankLayoutField("4", "CODIGO_INSCRICAO",  2,   3),
            new BankLayoutField("4", "NUMERO_INSCRICAO",  4,   17),
            new BankLayoutField("4", "AGENCIA",           18,  21),
            new BankLayoutField("4", "CONTA",             24,  28),
            new BankLayoutField("4", "DAC",               29,  29),
            new BankLayoutField("4", "NUM_CARTEIRA",      30,  32),
            new BankLayoutField("4", "NOSSO_NUMERO",      33,  40),
            new BankLayoutField("4", "DAC_NOSSO_NUMERO",  41,  41),
            new BankLayoutField("4", "SEQUENCIA",         42,  43),
            new BankLayoutField("4", "AGENCIA_01",        44,  47),
            new BankLayoutField("4", "CONTA_01",          48,  54),
            new BankLayoutField("4", "VALOR_01",          56,  68),
            new BankLayoutField("4", "AGENCIA_02",        69,  72),
            new BankLayoutField("4", "CONTA_02",          73,  79),
            new BankLayoutField("4", "VALOR_02",          81,  93),
            new BankLayoutField("4", "NUMERO_SEQUENCIAL", 395, 400)
    );

    // Tipo "5" → DETALHE EMAIL / SACADOR (opcional)
    private static final List<BankLayoutField> DETALHE_EMAIL = List.of(
            new BankLayoutField("5", "TIPO_REGISTRO",     1,   1),
            new BankLayoutField("5", "ENDERECO_EMAIL",    2,   121),
            new BankLayoutField("5", "COD_INSCRICAO",        122, 123),
            new BankLayoutField("5", "NUM_INSCRICAO",     124, 137),
            new BankLayoutField("5", "LOGRADOURO",        138, 177),
            new BankLayoutField("5", "BAIRRO",            178, 189),
            new BankLayoutField("5", "CEP",               190, 197),
            new BankLayoutField("5", "CIDADE",            198, 212),
            new BankLayoutField("5", "ESTADO",            213, 214),
            new BankLayoutField("5", "NUMERO_SEQUENCIAL", 395, 400)
    );

    // Tipo "9" → TRAILER
    private static final List<BankLayoutField> TRAILER = List.of(
            new BankLayoutField("9", "TIPO_REGISTRO",     1,   1),
            new BankLayoutField("9", "NUMERO_SEQUENCIAL", 395, 400)
    );

    private static final Map<String, List<BankLayoutField>> LAYOUT_BY_TYPE = Map.of(
            "0", HEADER,
            "1", DETALHE,
            "2", DETALHE_MULTA,
            "4", DETALHE_RATEIO,
            "5", DETALHE_EMAIL,
            "9", TRAILER
    );

    /** Retorna os campos do tipo correto com base no primeiro caractere da linha */
    public static List<BankLayoutField> getFieldsForLine(String line) {
        if (line == null || line.isEmpty()) return Collections.emptyList();
        return LAYOUT_BY_TYPE.getOrDefault(String.valueOf(line.charAt(0)), Collections.emptyList());
    }
}