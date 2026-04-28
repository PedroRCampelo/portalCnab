package com.pedrocampelo.cnabportal.service.fluxocaixasv;

import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.AlertaPreditivo;
import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaudeMesResponse;
import com.pedrocampelo.cnabportal.model.Recebimento;
import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.RecebimentoRepository;
import com.pedrocampelo.cnabportal.repository.SaldoBancarioRepository;
import com.pedrocampelo.cnabportal.repository.TituloRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Serviço central do módulo Fluxo de Caixa.
 *
 * MUDANÇA: usa SaldoBancarioService.calcularSaldoTotalEmpresa() em vez de
 * somarSaldosAtivos() (que tinha bug de duplicação por JOIN).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FluxoCaixaService {

    private final SaldoBancarioService    saldoBancarioService;
    private final SaldoBancarioRepository saldoRepository;
    private final RecebimentoRepository   recebimentoRepository;
    private final TituloRepository        tituloRepository;

    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM");
    private static final NumberFormat MOEDA_BR = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));

    public SaudeMesResponse calcularSaudeMes(Usuario usuario) {
        UUID empresaId = usuario.getEmpresa().getId();

        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        LocalDate fimMes = hoje.withDayOfMonth(hoje.lengthOfMonth());

        // ── Os 4 números principais ───────────────────────────────────────────
        BigDecimal saldoAtual    = saldoBancarioService.calcularSaldoTotalEmpresa(empresaId);
        BigDecimal aReceberMes   = recebimentoRepository.somarPendentesNoPeriodo(empresaId, inicioMes, fimMes);
        BigDecimal aPagarMes     = tituloRepository.somarPendentesPorEmpresaNoPeriodo(empresaId, inicioMes, fimMes);
        BigDecimal sobraOuFalta  = saldoAtual.add(aReceberMes).subtract(aPagarMes);

        // ── Indicadores derivados ─────────────────────────────────────────────
        String situacao = classificarSituacao(sobraOuFalta, saldoAtual);
        String mensagem = montarMensagemSituacao(situacao, sobraOuFalta);

        // ── Contagens ─────────────────────────────────────────────────────────
        int qtdContas = (int) saldoRepository.countByEmpresaIdAndAtivoTrue(empresaId);
        int qtdRecebAtrasados = recebimentoRepository.listarAtrasados(empresaId).size();
        int qtdTitulosAtrasados = tituloRepository.listarAtrasadosPorEmpresa(empresaId).size();

        // ── Alerta preditivo ──────────────────────────────────────────────────
        AlertaPreditivo alerta = calcularAlertaPreditivo(empresaId, saldoAtual, hoje);

        return new SaudeMesResponse(
                inicioMes, fimMes,
                saldoAtual, aReceberMes, aPagarMes, sobraOuFalta,
                situacao, mensagem,
                qtdContas, qtdRecebAtrasados, qtdTitulosAtrasados,
                alerta
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Alerta preditivo
    // ─────────────────────────────────────────────────────────────────────────

    private AlertaPreditivo calcularAlertaPreditivo(UUID empresaId, BigDecimal saldoAtual, LocalDate hoje) {
        LocalDate fimProjecao = hoje.plusDays(60);

        List<Recebimento> recebimentosFuturos = recebimentoRepository
                .listarProximosAVencer(empresaId, fimProjecao);

        List<Titulo> titulosFuturos = tituloRepository.listarAtrasadosPorEmpresa(empresaId)
                .stream()
                .filter(t -> t.getVencimento() != null && !t.getVencimento().isAfter(fimProjecao))
                .toList();

        if (saldoAtual.compareTo(BigDecimal.ZERO) < 0) {
            return new AlertaPreditivo(
                    hoje, saldoAtual,
                    "Seu saldo já está negativo em " + MOEDA_BR.format(saldoAtual.abs()),
                    0
            );
        }

        BigDecimal saldoSimulado = saldoAtual;
        for (int i = 0; i <= 60; i++) {
            LocalDate dia = hoje.plusDays(i);

            for (Recebimento r : recebimentosFuturos) {
                if (r.getDataVencimento() != null && r.getDataVencimento().isEqual(dia)) {
                    saldoSimulado = saldoSimulado.add(r.getSaldoPendente());
                }
            }

            for (Titulo t : titulosFuturos) {
                if (t.getVencimento() != null && t.getVencimento().isEqual(dia)) {
                    BigDecimal valor = t.getSaldo() != null ? t.getSaldo() : BigDecimal.ZERO;
                    saldoSimulado = saldoSimulado.subtract(valor);
                }
            }

            if (saldoSimulado.compareTo(BigDecimal.ZERO) < 0) {
                String msg = "Dia " + dia.format(DATA_BR) + " seu saldo vai ficar negativo em "
                        + MOEDA_BR.format(saldoSimulado.abs());
                return new AlertaPreditivo(dia, saldoSimulado, msg, i);
            }
        }

        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Classificação
    // ─────────────────────────────────────────────────────────────────────────

    private String classificarSituacao(BigDecimal sobraOuFalta, BigDecimal saldoAtual) {
        if (saldoAtual.compareTo(BigDecimal.ZERO) < 0) return "NEGATIVO";

        if (saldoAtual.compareTo(BigDecimal.ZERO) > 0
                && sobraOuFalta.compareTo(saldoAtual.multiply(new BigDecimal("0.30"))) >= 0) {
            return "POSITIVO";
        }

        if (sobraOuFalta.compareTo(BigDecimal.ZERO) > 0) return "NEUTRO";
        if (sobraOuFalta.compareTo(BigDecimal.ZERO) == 0) return "ATENCAO";
        return "NEGATIVO";
    }

    private String montarMensagemSituacao(String situacao, BigDecimal sobraOuFalta) {
        String valor = MOEDA_BR.format(sobraOuFalta.abs());
        return switch (situacao) {
            case "POSITIVO" -> "Você termina o mês positivo, com sobra de " + valor + ". 🎉";
            case "NEUTRO"   -> "Você termina o mês no azul, com sobra de " + valor + ".";
            case "ATENCAO"  -> "Atenção: você termina o mês empatado. Sem margem pra imprevistos.";
            case "NEGATIVO" -> "Cuidado: você termina o mês com falta de " + valor + ".";
            default         -> "";
        };
    }
}