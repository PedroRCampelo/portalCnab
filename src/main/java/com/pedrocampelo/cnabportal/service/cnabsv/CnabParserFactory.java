package com.pedrocampelo.cnabportal.service.cnabsv;

import com.pedrocampelo.cnabportal.layout.BankLayout;
import com.pedrocampelo.cnabportal.service.CnabParser;
import com.pedrocampelo.cnabportal.service.cnabsv.bbsv.BB240PagamentoParser;
import com.pedrocampelo.cnabportal.service.cnabsv.bradsv.Bradesco240PagamentoParser;
import com.pedrocampelo.cnabportal.service.cnabsv.bradsv.Bradesco400CobrancaParser;
import com.pedrocampelo.cnabportal.service.cnabsv.caixasv.Caixa240PagamentoParser;
import com.pedrocampelo.cnabportal.service.cnabsv.itausv.Itau240CobrancaParser;
import com.pedrocampelo.cnabportal.service.cnabsv.itausv.Itau240PagamentoParser;
import com.pedrocampelo.cnabportal.service.cnabsv.itausv.Itau400CobrancaParser;
import org.springframework.stereotype.Component;

/**
 * Factory que devolve o CnabParser correto para cada combinacao
 * banco x versao x modalidade.
 */
@Component
public class CnabParserFactory {

    private final Itau400CobrancaParser itau400Cobranca;
    private final Itau240CobrancaParser itau240Cobranca;
    private final Itau240PagamentoParser itau240Pagamento;
    private final Bradesco240PagamentoParser bradesco240Pagamento;
    private final Bradesco400CobrancaParser bradesco400Cobranca;
    private final BB240PagamentoParser bb240Pagamento;
    private final Caixa240PagamentoParser caixa240Pagamento;

    public CnabParserFactory(
            Itau400CobrancaParser      itau400Cobranca,
            Itau240CobrancaParser      itau240Cobranca,
            Itau240PagamentoParser     itau240Pagamento,
            Bradesco240PagamentoParser bradesco240Pagamento,
            Bradesco400CobrancaParser  bradesco400Cobranca,
            BB240PagamentoParser       bb240Pagamento,
            Caixa240PagamentoParser caixa240Pagamento) {
        this.itau400Cobranca      = itau400Cobranca;
        this.itau240Cobranca      = itau240Cobranca;
        this.itau240Pagamento     = itau240Pagamento;
        this.bradesco240Pagamento = bradesco240Pagamento;
        this.bradesco400Cobranca  = bradesco400Cobranca;
        this.bb240Pagamento       = bb240Pagamento;
        this.caixa240Pagamento    = caixa240Pagamento;
    }

    public CnabParser getParser(BankLayout layout) {
        return switch (layout) {
            case ITAU_400_COBRANCA      -> itau400Cobranca;
            case ITAU_240_COBRANCA      -> itau240Cobranca;
            case ITAU_240_PAGAMENTO     -> itau240Pagamento;
            case BRADESCO_240_PAGAMENTO -> bradesco240Pagamento;
            case BRADESCO_400_COBRANCA  -> bradesco400Cobranca;
            case BB_240_PAGAMENTO       -> bb240Pagamento;
            case CAIXA_240_PAGAMENTO    -> caixa240Pagamento;
        };
    }
}