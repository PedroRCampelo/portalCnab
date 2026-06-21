package com.pedrocampelo.cnabportal.dto;

import java.math.BigDecimal;
import java.util.List;

public record ComercialRelatorioResponse(
        List<FaturamentoMes>    faturamentoPorMes,
        List<VendaCliente>      vendasPorCliente,
        List<PedidoAberto>      pedidosEmAberto,
        FunilComercial          funil,
        List<PrevisaoMes>       previsaoFaturamento
) {

    public record FaturamentoMes(
            String     mes,       // "2026-01"
            BigDecimal valor
    ) {}

    public record VendaCliente(
            String     clienteNome,
            long       totalPedidos,
            BigDecimal valorTotal,
            BigDecimal valorEfetivado
    ) {}

    public record PedidoAberto(
            String     numero,
            String     clienteNome,
            BigDecimal valorTotal,
            String     primeiroVencimento,
            String     criadoEm,
            String     formaPagamento
    ) {}

    public record FunilComercial(
            long       orcamentosRascunho,
            long       orcamentosEnviados,
            long       orcamentosAprovados,
            long       orcamentosEmPedido,
            long       pedidosAbertos,
            long       pedidosEfetivados,
            long       pedidosCancelados,
            BigDecimal valorOrcamentosAprovados,
            BigDecimal valorPedidosAbertos,
            BigDecimal valorEfetivado
    ) {}

    public record PrevisaoMes(
            String     mes,
            BigDecimal valorPrevisto,   // pedidos ABERTO com vencimento no mês
            BigDecimal valorConfirmado  // pedidos EFETIVADO no mês
    ) {}
}
