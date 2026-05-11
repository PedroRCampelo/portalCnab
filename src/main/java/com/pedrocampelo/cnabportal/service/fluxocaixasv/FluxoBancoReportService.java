package com.pedrocampelo.cnabportal.service.fluxocaixasv;

import com.pedrocampelo.cnabportal.model.MovimentoBancario;
import com.pedrocampelo.cnabportal.model.SaldoBancario;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.MovimentoBancarioRepository;
import com.pedrocampelo.cnabportal.repository.RecebimentoRepository;
import com.pedrocampelo.cnabportal.repository.SaldoBancarioRepository;
import com.pedrocampelo.cnabportal.repository.TituloRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Serviço de relatórios de Fluxo e Banco + DRE.
 * Sprint Relatórios — Grupo 2
 *
 * Endpoint unificado: GET /api/fluxo-caixa/relatorio
 *
 * Retorna:
 *   - fluxoCaixa:   entradas x saídas mensais (últimos 12 meses + projeção 6 meses)
 *   - movimentos:   últimos 100 movimentos bancários consolidados
 *   - saldoPorConta: posição atual em cada conta
 *   - dre:          DRE simplificado — receitas, despesas e resultado por mês
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FluxoBancoReportService {

    private final SaldoBancarioService        saldoBancarioService;
    private final SaldoBancarioRepository      saldoRepository;
    private final MovimentoBancarioRepository  movimentoRepository;
    private final RecebimentoRepository        recebimentoRepository;
    private final TituloRepository             tituloRepository;

    private static final DateTimeFormatter FMT_MES = DateTimeFormatter.ofPattern("yyyy-MM");

    @Transactional(readOnly = true)
    public Map<String, Object> relatorioCompleto(Usuario usuario) {
        UUID empresaId = usuario.getEmpresa().getId();
        LocalDate hoje = LocalDate.now();

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("fluxoCaixa", calcularFluxoCaixa(empresaId, hoje));
        resultado.put("movimentos", calcularMovimentos(empresaId));
        resultado.put("saldoPorConta", calcularSaldoPorConta(empresaId));
        resultado.put("dre", calcularDre(empresaId, hoje));

        return resultado;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  FLUXO DE CAIXA — entradas x saídas por mês                          */
    /* ═══════════════════════════════════════════════════════════════════════ */

    private List<Map<String, Object>> calcularFluxoCaixa(UUID empresaId, LocalDate hoje) {
        // Últimos 12 meses + próximos 6 meses = 18 meses
        YearMonth inicio = YearMonth.from(hoje.minusMonths(11));
        YearMonth fim    = YearMonth.from(hoje.plusMonths(6));

        // Busca todos os movimentos do período
        List<MovimentoBancario> movimentos = movimentoRepository.extratoConsolidado(
                empresaId, PageRequest.of(0, 10000)
        ).getContent();

        // Agrupa por mês
        Map<String, BigDecimal> entradasPorMes = new TreeMap<>();
        Map<String, BigDecimal> saidasPorMes   = new TreeMap<>();

        for (MovimentoBancario m : movimentos) {
            if (Boolean.TRUE.equals(m.getCancelado())) continue;
            // Ignora estornos — são correções, não movimentações reais
            if (m.getTipo() != null && m.getTipo().startsWith("ESTORNO")) continue;

            String mes = m.getDataMovimento().format(FMT_MES);
            if (Boolean.TRUE.equals(m.getEhEntrada())) {
                entradasPorMes.merge(mes, m.getValor(), BigDecimal::add);
            } else {
                saidasPorMes.merge(mes, m.getValor(), BigDecimal::add);
            }
        }

        // Projeção futura: usa recebimentos e títulos pendentes
        YearMonth mesAtual = YearMonth.from(hoje);
        for (YearMonth ym = mesAtual.plusMonths(1); !ym.isAfter(fim); ym = ym.plusMonths(1)) {
            String mesKey = ym.format(FMT_MES);
            LocalDate inicioMes = ym.atDay(1);
            LocalDate fimMes    = ym.atEndOfMonth();

            BigDecimal aReceber = recebimentoRepository.somarPendentesNoPeriodo(empresaId, inicioMes, fimMes);
            BigDecimal aPagar   = tituloRepository.somarPendentesPorEmpresaNoPeriodo(empresaId, inicioMes, fimMes);

            if (aReceber.compareTo(BigDecimal.ZERO) > 0) {
                entradasPorMes.merge(mesKey, aReceber, BigDecimal::add);
            }
            if (aPagar.compareTo(BigDecimal.ZERO) > 0) {
                saidasPorMes.merge(mesKey, aPagar, BigDecimal::add);
            }
        }

        // Monta resultado
        List<Map<String, Object>> result = new ArrayList<>();
        for (YearMonth ym = inicio; !ym.isAfter(fim); ym = ym.plusMonths(1)) {
            String mesKey = ym.format(FMT_MES);
            BigDecimal entradas = entradasPorMes.getOrDefault(mesKey, BigDecimal.ZERO);
            BigDecimal saidas   = saidasPorMes.getOrDefault(mesKey, BigDecimal.ZERO);
            BigDecimal saldo    = entradas.subtract(saidas);
            boolean projetado   = ym.isAfter(mesAtual);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("mes", mesKey);
            m.put("entradas", entradas);
            m.put("saidas", saidas);
            m.put("saldo", saldo);
            m.put("projetado", projetado);
            result.add(m);
        }
        return result;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  MOVIMENTOS BANCÁRIOS — extrato consolidado                           */
    /* ═══════════════════════════════════════════════════════════════════════ */

    private List<Map<String, Object>> calcularMovimentos(UUID empresaId) {
        var page = movimentoRepository.extratoConsolidado(
                empresaId, PageRequest.of(0, 100)
        );

        List<Map<String, Object>> result = new ArrayList<>();
        for (MovimentoBancario m : page.getContent()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", m.getId().toString());
            item.put("data", m.getDataMovimento().toString());
            item.put("tipo", m.getTipo());
            item.put("ehEntrada", m.getEhEntrada());
            item.put("valor", m.getValor());
            item.put("descricao", m.getDescricao());
            item.put("conta", m.getConta() != null ? m.getConta().getNomeConta() : "—");
            item.put("cancelado", Boolean.TRUE.equals(m.getCancelado()));
            result.add(item);
        }
        return result;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  SALDO POR CONTA — posição atual                                      */
    /* ═══════════════════════════════════════════════════════════════════════ */

    private List<Map<String, Object>> calcularSaldoPorConta(UUID empresaId) {
        List<SaldoBancario> contas = saldoRepository.listarAtivas(empresaId);

        List<Map<String, Object>> result = new ArrayList<>();
        BigDecimal totalGeral = BigDecimal.ZERO;

        for (SaldoBancario conta : contas) {
            BigDecimal saldoAtual = saldoBancarioService.calcularSaldoAtualEntidade(conta);
            totalGeral = totalGeral.add(saldoAtual);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", conta.getId().toString());
            item.put("nome", conta.getNomeConta());
            item.put("banco", conta.getBanco() != null ? conta.getBanco() : "—");
            item.put("saldoInicial", conta.getSaldoInicial());
            item.put("saldoAtual", saldoAtual);
            item.put("principal", Boolean.TRUE.equals(conta.getPrincipal()));
            result.add(item);
        }

        // Adiciona total geral como último item
        if (!result.isEmpty()) {
            Map<String, Object> totalItem = new LinkedHashMap<>();
            totalItem.put("id", "total");
            totalItem.put("nome", "Total geral");
            totalItem.put("banco", "");
            totalItem.put("saldoInicial", BigDecimal.ZERO);
            totalItem.put("saldoAtual", totalGeral);
            totalItem.put("principal", false);
            totalItem.put("ehTotal", true);
            result.add(totalItem);
        }

        return result;
    }

    /* ═══════════════════════════════════════════════════════════════════════ */
    /*  DRE MENSAL — Demonstrativo de Resultados                             */
    /* ═══════════════════════════════════════════════════════════════════════ */

    private List<Map<String, Object>> calcularDre(UUID empresaId, LocalDate hoje) {
        // Últimos 12 meses
        YearMonth inicio = YearMonth.from(hoje.minusMonths(11));
        YearMonth fim    = YearMonth.from(hoje);

        // Busca movimentos pra cálculo
        List<MovimentoBancario> movimentos = movimentoRepository.extratoConsolidado(
                empresaId, PageRequest.of(0, 10000)
        ).getContent();

        // Agrupa por mês
        Map<String, BigDecimal> receitasPorMes = new TreeMap<>();
        Map<String, BigDecimal> despesasPorMes = new TreeMap<>();

        for (MovimentoBancario m : movimentos) {
            if (Boolean.TRUE.equals(m.getCancelado())) continue;
            // Ignora estornos e ajustes pra DRE limpo
            if (m.getTipo() != null && m.getTipo().startsWith("ESTORNO")) continue;

            String mes = m.getDataMovimento().format(FMT_MES);
            if (Boolean.TRUE.equals(m.getEhEntrada())) {
                receitasPorMes.merge(mes, m.getValor(), BigDecimal::add);
            } else {
                despesasPorMes.merge(mes, m.getValor(), BigDecimal::add);
            }
        }

        // Monta DRE
        List<Map<String, Object>> result = new ArrayList<>();
        BigDecimal totalReceitas = BigDecimal.ZERO;
        BigDecimal totalDespesas = BigDecimal.ZERO;

        for (YearMonth ym = inicio; !ym.isAfter(fim); ym = ym.plusMonths(1)) {
            String mesKey = ym.format(FMT_MES);
            BigDecimal receitas = receitasPorMes.getOrDefault(mesKey, BigDecimal.ZERO);
            BigDecimal despesas = despesasPorMes.getOrDefault(mesKey, BigDecimal.ZERO);
            BigDecimal resultado = receitas.subtract(despesas);
            BigDecimal margem = receitas.compareTo(BigDecimal.ZERO) > 0
                    ? resultado.multiply(BigDecimal.valueOf(100)).divide(receitas, 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            totalReceitas = totalReceitas.add(receitas);
            totalDespesas = totalDespesas.add(despesas);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("mes", mesKey);
            item.put("receitas", receitas);
            item.put("despesas", despesas);
            item.put("resultado", resultado);
            item.put("margem", margem);
            result.add(item);
        }

        // Linha de total
        BigDecimal resultadoTotal = totalReceitas.subtract(totalDespesas);
        BigDecimal margemTotal = totalReceitas.compareTo(BigDecimal.ZERO) > 0
                ? resultadoTotal.multiply(BigDecimal.valueOf(100)).divide(totalReceitas, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> total = new LinkedHashMap<>();
        total.put("mes", "total");
        total.put("receitas", totalReceitas);
        total.put("despesas", totalDespesas);
        total.put("resultado", resultadoTotal);
        total.put("margem", margemTotal);
        total.put("ehTotal", true);
        result.add(total);

        return result;
    }
}