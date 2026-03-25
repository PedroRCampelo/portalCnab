package com.pedrocampelo.cnabportal.service;

import com.pedrocampelo.cnabportal.layout.BankLayout;
import org.springframework.stereotype.Component;

/**
 * Factory que devolve o CnabParser correto para cada combinação
 * banco × versão × modalidade.
 *
 * Injetada pelo Spring via construtor; adicionar novos parsers aqui
 * sem tocar no Controller.
 */
@Component
public class CnabParserFactory {

    private final Itau400CobrancaParser itau400Cobranca;
    private final Itau240PagamentoParser itau240Pagamento;

    public CnabParserFactory(
            Itau400CobrancaParser itau400Cobranca,
            Itau240PagamentoParser itau240Pagamento) {
        this.itau400Cobranca = itau400Cobranca;
        this.itau240Pagamento = itau240Pagamento;
    }

    public CnabParser getParser(BankLayout layout) {
        return switch (layout) {
            case ITAU_400_COBRANCA  -> itau400Cobranca;
            case ITAU_240_PAGAMENTO -> itau240Pagamento;
        };
    }
}