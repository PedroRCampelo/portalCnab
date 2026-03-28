package com.pedrocampelo.cnabportal.service;

import com.pedrocampelo.cnabportal.layout.BankLayout;
import com.pedrocampelo.cnabportal.service.bradsv.Bradesco240PagamentoParser;
import com.pedrocampelo.cnabportal.service.itausv.Itau240CobrancaParser;
import com.pedrocampelo.cnabportal.service.itausv.Itau240PagamentoParser;
import com.pedrocampelo.cnabportal.service.itausv.Itau400CobrancaParser;
import org.springframework.stereotype.Component;

/**
 * Factory que devolve o CnabParser correto para cada combinação
 * banco × versão × modalidade.
 */
@Component
public class CnabParserFactory {

    private final Itau400CobrancaParser itau400Cobranca;
    private final Itau240CobrancaParser itau240Cobranca;
    private final Itau240PagamentoParser itau240Pagamento;
    private final Bradesco240PagamentoParser bradesco240Pagamento;

    public CnabParserFactory(
            Itau400CobrancaParser      itau400Cobranca,
            Itau240CobrancaParser      itau240Cobranca,
            Itau240PagamentoParser     itau240Pagamento,
            Bradesco240PagamentoParser bradesco240Pagamento) {
        this.itau400Cobranca      = itau400Cobranca;
        this.itau240Cobranca      = itau240Cobranca;
        this.itau240Pagamento     = itau240Pagamento;
        this.bradesco240Pagamento = bradesco240Pagamento;
    }

    public CnabParser getParser(BankLayout layout) {
        return switch (layout) {
            case ITAU_400_COBRANCA      -> itau400Cobranca;
            case ITAU_240_COBRANCA      -> itau240Cobranca;
            case ITAU_240_PAGAMENTO     -> itau240Pagamento;
            case BRADESCO_240_PAGAMENTO -> bradesco240Pagamento;
        };
    }
}