package com.pedrocampelo.cnabportal.service.recebimentossv;

import com.pedrocampelo.cnabportal.model.Recebimento;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.RecebimentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de relatórios de recebimentos (A Receber).
 * Sprint 2.3-Relatórios
 *
 * Endpoint unificado: GET /api/recebimentos/relatorio
 *
 * Retorna:
 *   - aging:      faixas de atraso dos recebimentos vencidos
 *   - porCliente: top clientes por valor em aberto
 *   - historico:  timeline de recebimentos pagos (últimos 12 meses)
 *   - fluxoCaixa: vencimentos futuros agrupados por mês
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecebimentoReportService {

    private final RecebimentoRepository recebimentoRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> relatorioCompleto(Usuario usuario) {
        UUID empresaId = usuario.getEmpresa().getId();
        LocalDate hoje = LocalDate.now();

        // Busca todos os recebimentos da empresa (sem paginação, pra relatório)
        List<Recebimento> todos = recebimentoRepository.findByEmpresaIdOrderByDataVencimentoAsc(empresaId);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("aging", calcularAging(todos, hoje));
        resultado.put("porCliente", calcularPorCliente(todos));
        resultado.put("historico", calcularHistorico(todos));
        resultado.put("fluxoCaixa", calcularFluxoCaixa(todos, hoje));

        return resultado;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  AGING — faixas de atraso                                             */
    /* ═══════════════════════════════════════════════════════════════════════ */

    private List<Map<String, Object>> calcularAging(List<Recebimento> todos, LocalDate hoje) {
        // Filtra recebimentos vencidos e não pagos
        List<Recebimento> vencidos = todos.stream()
                .filter(r -> !r.estaFinalizado())
                .filter(r -> r.getDataVencimento().isBefore(hoje))
                .toList();

        // Agrupa por faixa de atraso
        Map<String, BigDecimal> totalPorFaixa = new LinkedHashMap<>();
        Map<String, Integer> qtdPorFaixa = new LinkedHashMap<>();

        for (String faixa : List.of("0-30", "31-60", "61-90", "+90")) {
            totalPorFaixa.put(faixa, BigDecimal.ZERO);
            qtdPorFaixa.put(faixa, 0);
        }

        for (Recebimento r : vencidos) {
            long diasAtraso = hoje.toEpochDay() - r.getDataVencimento().toEpochDay();
            String faixa;
            if (diasAtraso <= 30) faixa = "0-30";
            else if (diasAtraso <= 60) faixa = "31-60";
            else if (diasAtraso <= 90) faixa = "61-90";
            else faixa = "+90";

            totalPorFaixa.merge(faixa, r.getSaldoPendente(), BigDecimal::add);
            qtdPorFaixa.merge(faixa, 1, Integer::sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (String faixa : totalPorFaixa.keySet()) {
            if (qtdPorFaixa.get(faixa) > 0) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("nome", faixa);
                m.put("total", totalPorFaixa.get(faixa));
                m.put("quantidade", qtdPorFaixa.get(faixa));
                result.add(m);
            }
        }
        return result;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  POR CLIENTE — top clientes por valor em aberto                       */
    /* ═══════════════════════════════════════════════════════════════════════ */

    private List<Map<String, Object>> calcularPorCliente(List<Recebimento> todos) {
        // Filtra recebimentos em aberto (não finalizados)
        List<Recebimento> emAberto = todos.stream()
                .filter(r -> !r.estaFinalizado())
                .toList();

        // Agrupa por cliente
        Map<String, BigDecimal> totalPorCliente = new LinkedHashMap<>();
        Map<String, Integer> qtdPorCliente = new LinkedHashMap<>();
        Map<String, BigDecimal> recebidoPorCliente = new LinkedHashMap<>();

        // Também calcula total recebido pra cada cliente (dos finalizados)
        for (Recebimento r : todos) {
            String nomeCliente = r.getCliente() != null ? r.getCliente().getNome() : "Sem cliente";

            if (!r.estaFinalizado()) {
                totalPorCliente.merge(nomeCliente, r.getSaldoPendente(), BigDecimal::add);
                qtdPorCliente.merge(nomeCliente, 1, Integer::sum);
            }

            if ("RECEBIDO".equals(r.getStatus())) {
                recebidoPorCliente.merge(nomeCliente, r.getValorRecebido(), BigDecimal::add);
            }
        }

        // Monta lista ordenada por valor em aberto DESC
        List<Map<String, Object>> result = new ArrayList<>();
        totalPorCliente.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .forEach(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("nome", entry.getKey());
                    m.put("total", entry.getValue());
                    m.put("quantidade", qtdPorCliente.getOrDefault(entry.getKey(), 0));
                    m.put("recebido", recebidoPorCliente.getOrDefault(entry.getKey(), BigDecimal.ZERO));
                    result.add(m);
                });

        return result;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  HISTÓRICO — timeline de pagamentos recebidos                         */
    /* ═══════════════════════════════════════════════════════════════════════ */

    private List<Map<String, Object>> calcularHistorico(List<Recebimento> todos) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");

        // Filtra recebidos nos últimos 12 meses
        LocalDate limiteInferior = LocalDate.now().minusMonths(12).withDayOfMonth(1);

        List<Recebimento> recebidos = todos.stream()
                .filter(r -> "RECEBIDO".equals(r.getStatus()))
                .filter(r -> r.getDataRecebimento() != null)
                .filter(r -> !r.getDataRecebimento().isBefore(limiteInferior))
                .toList();

        // Agrupa por mês de recebimento
        Map<String, BigDecimal> totalPorMes = new TreeMap<>();
        Map<String, Integer> qtdPorMes = new TreeMap<>();

        for (Recebimento r : recebidos) {
            String mes = r.getDataRecebimento().format(fmt);
            totalPorMes.merge(mes, r.getValorRecebido(), BigDecimal::add);
            qtdPorMes.merge(mes, 1, Integer::sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (String mes : totalPorMes.keySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("mes", mes);
            m.put("total", totalPorMes.get(mes));
            m.put("quantidade", qtdPorMes.get(mes));
            result.add(m);
        }

        return result;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  FLUXO DE CAIXA — vencimentos futuros por mês                         */
    /* ═══════════════════════════════════════════════════════════════════════ */

    private List<Map<String, Object>> calcularFluxoCaixa(List<Recebimento> todos, LocalDate hoje) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        LocalDate fim = hoje.withDayOfMonth(1).plusMonths(12).minusDays(1);

        // Recebimentos pendentes com vencimento futuro
        List<Recebimento> futuros = todos.stream()
                .filter(r -> !r.estaFinalizado())
                .filter(r -> !r.getDataVencimento().isBefore(hoje))
                .filter(r -> !r.getDataVencimento().isAfter(fim))
                .toList();

        Map<String, BigDecimal> totalPorMes = new TreeMap<>();
        Map<String, Integer> qtdPorMes = new TreeMap<>();

        for (Recebimento r : futuros) {
            String mes = r.getDataVencimento().format(fmt);
            totalPorMes.merge(mes, r.getSaldoPendente(), BigDecimal::add);
            qtdPorMes.merge(mes, 1, Integer::sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (String mes : totalPorMes.keySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("mes", mes);
            m.put("total", totalPorMes.get(mes));
            m.put("quantidade", qtdPorMes.get(mes));
            result.add(m);
        }

        return result;
    }
}