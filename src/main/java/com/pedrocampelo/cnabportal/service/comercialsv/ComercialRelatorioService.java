package com.pedrocampelo.cnabportal.service.comercialsv;

import com.pedrocampelo.cnabportal.dto.ComercialRelatorioResponse;
import com.pedrocampelo.cnabportal.dto.ComercialRelatorioResponse.*;
import com.pedrocampelo.cnabportal.repository.OrcamentoRepository;
import com.pedrocampelo.cnabportal.repository.PedidoVendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ComercialRelatorioService {

    private final OrcamentoRepository  orcamentoRepository;
    private final PedidoVendaRepository pedidoVendaRepository;

    public ComercialRelatorioResponse gerar(UUID empresaId) {
        var pedidos    = pedidoVendaRepository.findAllByEmpresaId(empresaId);
        var orcamentos = orcamentoRepository.findAllByEmpresaId(empresaId);

        return new ComercialRelatorioResponse(
                calcFaturamentoPorMes(pedidos),
                calcVendasPorCliente(pedidos),
                calcPedidosEmAberto(pedidos),
                calcFunil(orcamentos, pedidos),
                calcPrevisao(pedidos)
        );
    }

    // ─── Faturamento por mês (pedidos EFETIVADO, agrupados por mês de efetivação) ───

    private List<FaturamentoMes> calcFaturamentoPorMes(
            List<com.pedrocampelo.cnabportal.model.PedidoVenda> pedidos) {

        return pedidos.stream()
                .filter(p -> "EFETIVADO".equals(p.getStatus()) && p.getEfetivadoEm() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getEfetivadoEm().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        TreeMap::new,
                        Collectors.reducing(BigDecimal.ZERO,
                                com.pedrocampelo.cnabportal.model.PedidoVenda::getValorTotal,
                                BigDecimal::add)
                ))
                .entrySet().stream()
                .map(e -> new FaturamentoMes(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    // ─── Vendas por cliente (todos os pedidos não cancelados) ───────────────────

    private List<VendaCliente> calcVendasPorCliente(
            List<com.pedrocampelo.cnabportal.model.PedidoVenda> pedidos) {

        record Acc(long total, BigDecimal valorTotal, BigDecimal valorEfetivado) {}

        var map = new TreeMap<String, Acc>();

        for (var p : pedidos) {
            if ("CANCELADO".equals(p.getStatus())) continue;
            String nome = p.getCliente() != null ? p.getCliente().getNome() : "Desconhecido";
            var acc = map.getOrDefault(nome, new Acc(0, BigDecimal.ZERO, BigDecimal.ZERO));
            BigDecimal efetivado = "EFETIVADO".equals(p.getStatus()) ? p.getValorTotal() : BigDecimal.ZERO;
            map.put(nome, new Acc(acc.total() + 1, acc.valorTotal().add(p.getValorTotal()), acc.valorEfetivado().add(efetivado)));
        }

        return map.entrySet().stream()
                .map(e -> new VendaCliente(e.getKey(), e.getValue().total(), e.getValue().valorTotal(), e.getValue().valorEfetivado()))
                .sorted(Comparator.comparing(VendaCliente::valorTotal).reversed())
                .collect(Collectors.toList());
    }

    // ─── Pedidos em aberto ──────────────────────────────────────────────────────

    private List<PedidoAberto> calcPedidosEmAberto(
            List<com.pedrocampelo.cnabportal.model.PedidoVenda> pedidos) {

        DateTimeFormatter fmtData = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        return pedidos.stream()
                .filter(p -> "ABERTO".equals(p.getStatus()))
                .sorted(Comparator.comparing(
                        com.pedrocampelo.cnabportal.model.PedidoVenda::getPrimeiroVencimento))
                .map(p -> new PedidoAberto(
                        p.getNumero(),
                        p.getCliente() != null ? p.getCliente().getNome() : "—",
                        p.getValorTotal(),
                        p.getPrimeiroVencimento().format(fmtData),
                        p.getCriadoEm().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                        p.getFormaPagamento()
                ))
                .collect(Collectors.toList());
    }

    // ─── Funil comercial ────────────────────────────────────────────────────────

    private FunilComercial calcFunil(
            List<com.pedrocampelo.cnabportal.model.Orcamento> orcamentos,
            List<com.pedrocampelo.cnabportal.model.PedidoVenda> pedidos) {

        long orcRascunho  = orcamentos.stream().filter(o -> "RASCUNHO".equals(o.getStatus())).count();
        long orcEnviado   = orcamentos.stream().filter(o -> "ENVIADO".equals(o.getStatus())).count();
        long orcAprovado  = orcamentos.stream().filter(o -> "APROVADO".equals(o.getStatus())).count();
        long orcEmPedido  = orcamentos.stream().filter(o -> "EM_PEDIDO".equals(o.getStatus())).count();

        BigDecimal valorOrcAprovados = orcamentos.stream()
                .filter(o -> "APROVADO".equals(o.getStatus()))
                .map(com.pedrocampelo.cnabportal.model.Orcamento::getValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pvAbertos    = pedidos.stream().filter(p -> "ABERTO".equals(p.getStatus())).count();
        long pvEfetivados = pedidos.stream().filter(p -> "EFETIVADO".equals(p.getStatus())).count();
        long pvCancelados = pedidos.stream().filter(p -> "CANCELADO".equals(p.getStatus())).count();

        BigDecimal valorAbertos = pedidos.stream()
                .filter(p -> "ABERTO".equals(p.getStatus()))
                .map(com.pedrocampelo.cnabportal.model.PedidoVenda::getValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal valorEfetivado = pedidos.stream()
                .filter(p -> "EFETIVADO".equals(p.getStatus()))
                .map(com.pedrocampelo.cnabportal.model.PedidoVenda::getValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new FunilComercial(
                orcRascunho, orcEnviado, orcAprovado, orcEmPedido,
                pvAbertos, pvEfetivados, pvCancelados,
                valorOrcAprovados, valorAbertos, valorEfetivado
        );
    }

    // ─── Previsão de faturamento (próximos 6 meses) ─────────────────────────────

    private List<PrevisaoMes> calcPrevisao(
            List<com.pedrocampelo.cnabportal.model.PedidoVenda> pedidos) {

        LocalDate hoje = LocalDate.now();
        var meses = new ArrayList<String>();
        for (int i = 0; i < 6; i++) {
            meses.add(hoje.plusMonths(i).format(DateTimeFormatter.ofPattern("yyyy-MM")));
        }

        Map<String, BigDecimal> previsto   = new TreeMap<>();
        Map<String, BigDecimal> confirmado = new TreeMap<>();
        meses.forEach(m -> { previsto.put(m, BigDecimal.ZERO); confirmado.put(m, BigDecimal.ZERO); });

        for (var p : pedidos) {
            if ("ABERTO".equals(p.getStatus()) && p.getPrimeiroVencimento() != null) {
                String mes = p.getPrimeiroVencimento().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                if (previsto.containsKey(mes)) {
                    previsto.merge(mes, p.getValorTotal(), BigDecimal::add);
                }
            }
            if ("EFETIVADO".equals(p.getStatus()) && p.getEfetivadoEm() != null) {
                String mes = p.getEfetivadoEm().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                if (confirmado.containsKey(mes)) {
                    confirmado.merge(mes, p.getValorTotal(), BigDecimal::add);
                }
            }
        }

        return meses.stream()
                .map(m -> new PrevisaoMes(m, previsto.get(m), confirmado.get(m)))
                .collect(Collectors.toList());
    }
}
