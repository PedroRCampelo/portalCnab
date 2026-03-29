package com.pedrocampelo.cnabportal.layout.bradesco;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Layout Bradesco CNAB 400 — Cobrança (Remessa e Retorno).
 * Baseado no Manual de Procedimentos Operacionais Versão Março/2023.
 *
 * Banco: 237 — Bradesco
 * Tamanho do registro: 400 bytes (CNAB 400)
 *
 * Estrutura do arquivo CNAB 400 Bradesco Cobrança:
 *   Registro 0  — Header Label (1 por arquivo)
 *   Registro 1  — Transação (um por título)
 *   Registro 2  — Mensagem (opcional, adicional ao tipo 1)
 *   Registro 3  — Rateio de Crédito (opcional)
 *   Registro 6  — Múltiplas Transferências / Débito Automático (opcional)
 *   Registro 7  — Beneficiário Final (opcional)
 *   Registro 9  — Trailer
 *
 * No CNAB 400 NÃO existe conceito de lote — os registros de detalhe são
 * tipo "1" diretamente, sem header/trailer de lote.
 *
 * Tipo de registro: posição 1 (index 0)
 *   0 = Header
 *   1 = Detalhe (transação — boleto)
 *   2 = Mensagem (opcional)
 *   3 = Rateio de Crédito (opcional)
 *   6 = Débito Automático / Múltiplas Transferências (opcional)
 *   7 = Beneficiário Final (opcional)
 *   9 = Trailer
 */
public class Bradesco400CobrancaLayout {

    // ── Header Label (tipo 0) — 400 posições ─────────────────────────────
    private static final List<BankLayoutField> HEADER = List.of(
            new BankLayoutField("0", "TIPO_REGISTRO",        1,   1),   // '0'
            new BankLayoutField("0", "ID_ARQUIVO_REMESSA",   2,   2),   // '1'
            new BankLayoutField("0", "LITERAL_REMESSA",      3,   9),   // 'REMESSA'
            new BankLayoutField("0", "CODIGO_SERVICO",       10,  11),  // '01'
            new BankLayoutField("0", "LITERAL_SERVICO",      12,  26),  // 'COBRANCA'
            new BankLayoutField("0", "CODIGO_EMPRESA",       27,  46),  // fornecido pelo Bradesco
            new BankLayoutField("0", "NOME_EMPRESA",         47,  76),  // Razão Social
            new BankLayoutField("0", "BANCO_COMPENSACAO",    77,  79),  // '237'
            new BankLayoutField("0", "NOME_BANCO",           80,  94),  // 'Bradesco'
            new BankLayoutField("0", "DATA_GRAVACAO",        95,  100), // DDMMAA
            new BankLayoutField("0", "ID_SISTEMA",           109, 110), // 'MX'
            new BankLayoutField("0", "NUM_SEQ_REMESSA",      111, 117), // sequencial
            new BankLayoutField("0", "NUM_SEQ_REGISTRO",     395, 400)  // '000001'
    );

    // ── Registro de Transação (tipo 1) — Detalhe do boleto ───────────────
    private static final List<BankLayoutField> TRANSACAO = List.of(
            new BankLayoutField("1", "TIPO_REGISTRO",        1,   1),   // '1'
            // Débito Automático (opcional)
            new BankLayoutField("1", "AGENCIA_DEBITO",       2,   6),
            new BankLayoutField("1", "DV_AGENCIA_DEBITO",    7,   7),
            new BankLayoutField("1", "RAZAO_CONTA",          8,   12),
            new BankLayoutField("1", "CONTA_CORRENTE",       13,  19),
            new BankLayoutField("1", "DV_CONTA",             20,  20),
            // Identificação da empresa beneficiária no banco
            // Formato: Zero(1)+Carteira(3)+Agência(5)+ContaCorrente(7)+DAC(1) = 17 pos
            new BankLayoutField("1", "ID_EMPRESA_BANCO",     21,  37),
            new BankLayoutField("1", "NUM_CONTROLE",         38,  62),  // uso da empresa (25 pos)
            new BankLayoutField("1", "BANCO_DEBITO",         63,  65),  // '237'
            new BankLayoutField("1", "CAMPO_MULTA",          66,  66),  // 0=sem multa 2=percentual
            new BankLayoutField("1", "PERCENTUAL_MULTA",     67,  70),
            // Nosso Número: 11 dígitos + 1 DAC = 12
            new BankLayoutField("1", "NOSSO_NUMERO",         71,  81),
            new BankLayoutField("1", "DAC_NOSSO_NUMERO",     82,  82),
            new BankLayoutField("1", "DESCONTO_BONIF_DIA",   83,  92),  // valor desconto bonif/dia
            new BankLayoutField("1", "CONDICAO_EMISSAO",     93,  93),  // 1=banco 2=empresa
            new BankLayoutField("1", "EMITE_BOLETO_DEBITO",  94,  94),  // N=não; outros=sim
            new BankLayoutField("1", "ID_OPERACAO_BANCO",    95,  104),
            new BankLayoutField("1", "INDICADOR_RATEIO",     105, 105), // 'R'
            new BankLayoutField("1", "END_AVISO_DEBITO",     106, 106),
            new BankLayoutField("1", "QTD_PAGAMENTOS",       107, 108),
            new BankLayoutField("1", "OCORRENCIA",           109, 110), // código de ocorrência
            new BankLayoutField("1", "NUM_DOCUMENTO",        111, 120), // nº do documento
            new BankLayoutField("1", "VENCIMENTO",           121, 126), // DDMMAA
            new BankLayoutField("1", "VALOR_TITULO",         127, 139), // 11V2 (sem ponto/vírgula)
            new BankLayoutField("1", "BANCO_COBRADOR",       140, 142), // zeros
            new BankLayoutField("1", "AGENCIA_DEPOSITARIA",  143, 147), // zeros
            new BankLayoutField("1", "ESPECIE_TITULO",       148, 149), // 01=dup 02=NP 05=recibo etc
            new BankLayoutField("1", "IDENTIFICACAO",        150, 150), // sempre 'N'
            new BankLayoutField("1", "DATA_EMISSAO",         151, 156), // DDMMAA
            new BankLayoutField("1", "INSTRUCAO_1",          157, 158),
            new BankLayoutField("1", "INSTRUCAO_2",          159, 160),
            new BankLayoutField("1", "MORA_DIA",             161, 173), // valor mora por dia
            new BankLayoutField("1", "DATA_LIMITE_DESCONTO", 174, 179), // DDMMAA
            new BankLayoutField("1", "VALOR_DESCONTO",       180, 192),
            new BankLayoutField("1", "VALOR_IOF",            193, 205),
            new BankLayoutField("1", "VALOR_ABATIMENTO",     206, 218),
            new BankLayoutField("1", "TIPO_INSCRICAO",       219, 220), // 01=CPF 02=CNPJ
            new BankLayoutField("1", "INSCRICAO_PAGADOR",    221, 234), // CPF/CNPJ (obrigatório)
            new BankLayoutField("1", "NOME_PAGADOR",         235, 274),
            new BankLayoutField("1", "ENDERECO_PAGADOR",     275, 314),
            new BankLayoutField("1", "MENSAGEM_1",           315, 326),
            new BankLayoutField("1", "CEP_PAGADOR",          327, 331),
            new BankLayoutField("1", "SUFIXO_CEP",           332, 334),
            new BankLayoutField("1", "BENEFICIARIO_FINAL",   335, 394), // ou 2ª mensagem
            new BankLayoutField("1", "NUM_SEQ_REGISTRO",     395, 400)
    );

    // ── Registro de Mensagem (tipo 2) — OPCIONAL ─────────────────────────
    private static final List<BankLayoutField> MENSAGEM = List.of(
            new BankLayoutField("2", "TIPO_REGISTRO",        1,   1),   // '2'
            new BankLayoutField("2", "MENSAGEM_1",           2,   81),
            new BankLayoutField("2", "MENSAGEM_2",           82,  161),
            new BankLayoutField("2", "MENSAGEM_3",           162, 241),
            new BankLayoutField("2", "MENSAGEM_4",           242, 321),
            new BankLayoutField("2", "DATA_LIMITE_DESC2",    322, 327), // DDMMAA
            new BankLayoutField("2", "VALOR_DESCONTO_2",     328, 340),
            new BankLayoutField("2", "DATA_LIMITE_DESC3",    341, 346), // DDMMAA
            new BankLayoutField("2", "VALOR_DESCONTO_3",     347, 359),
            new BankLayoutField("2", "CARTEIRA",             367, 369),
            new BankLayoutField("2", "AGENCIA",              370, 374),
            new BankLayoutField("2", "CONTA_CORRENTE",       375, 381),
            new BankLayoutField("2", "DV_CC",                382, 382),
            new BankLayoutField("2", "NOSSO_NUMERO",         383, 393),
            new BankLayoutField("2", "DAC_NOSSO_NUMERO",     394, 394),
            new BankLayoutField("2", "NUM_SEQ_REGISTRO",     395, 400)
    );

    // ── Registro de Rateio de Crédito (tipo 3) — OPCIONAL ────────────────
    private static final List<BankLayoutField> RATEIO = List.of(
            new BankLayoutField("3", "TIPO_REGISTRO",        1,   1),   // '3'
            new BankLayoutField("3", "ID_EMPRESA_BANCO",     2,   17),
            new BankLayoutField("3", "ID_TITULO_BANCO",      18,  29),
            new BankLayoutField("3", "COD_CALCULO_RATEIO",   30,  30),
            new BankLayoutField("3", "TIPO_VALOR",           31,  31),
            new BankLayoutField("3", "BANCO_BENEF1",         44,  46),  // '237'
            new BankLayoutField("3", "AGENCIA_BENEF1",       47,  51),
            new BankLayoutField("3", "DV_AGENCIA_BENEF1",    52,  52),
            new BankLayoutField("3", "CONTA_BENEF1",         53,  64),
            new BankLayoutField("3", "DV_CONTA_BENEF1",      65,  65),
            new BankLayoutField("3", "VALOR_RATEIO_1",       66,  80),
            new BankLayoutField("3", "NOME_BENEF1",          81,  120),
            new BankLayoutField("3", "PARCELA",              152, 157),
            new BankLayoutField("3", "FLOATING_BENEF1",      158, 160),
            new BankLayoutField("3", "NUM_SEQ_REGISTRO",     395, 400)
    );

    // ── Trailer (tipo 9) ──────────────────────────────────────────────────
    private static final List<BankLayoutField> TRAILER = List.of(
            new BankLayoutField("9", "TIPO_REGISTRO",        1,   1),   // '9'
            new BankLayoutField("9", "NUM_SEQ_REGISTRO",     395, 400)
    );

    // ── Mapa principal ────────────────────────────────────────────────────
    // No CNAB 400 o tipo de registro fica na posição 1 (index 0)
    private static final Map<String, List<BankLayoutField>> FIELDS_BY_RECORD_TYPE =
            Map.of(
                    "0", HEADER,
                    "1", TRANSACAO,
                    "2", MENSAGEM,
                    "3", RATEIO,
                    "9", TRAILER
            );

    /**
     * No CNAB 400 Bradesco, o tipo de registro está na posição 1 (index 0).
     */
    public static List<BankLayoutField> getFieldsForLine(String line) {
        if (line == null || line.isEmpty()) return Collections.emptyList();
        String key = String.valueOf(line.charAt(0));
        return FIELDS_BY_RECORD_TYPE.getOrDefault(key, Collections.emptyList());
    }

    public static String getRecordType(String line) {
        if (line == null || line.isEmpty()) return "?";
        return String.valueOf(line.charAt(0));
    }
}