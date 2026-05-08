package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.dto.TermometroFaturamentoResponse;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.RegimeTributario;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import com.pedrocampelo.cnabportal.repository.RecebimentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.Locale;

/**
 * Serviço do Termômetro de Faturamento
 * Sprint 2.2-B
 *
 * Calcula quanto o MEI já faturou no ano vs limite anual,
 * projeta em que mês atinge o limite e classifica o alerta.
 *
 * Lógica de projeção:
 *   1. Soma recebimentos com status RECEBIDO no ano corrente
 *   2. Conta quantos meses tiveram receita (meses com atividade)
 *   3. Calcula média mensal = faturado / meses com receita
 *   4. Projeta: restante / média mensal = meses até estourar
 *   5. Mês de estouro = mês atual + meses até estourar
 *
 * Decisão importante: usamos "meses com receita" (não mês corrente)
 * pra média mensal. Isso evita distorção se o MEI começou a usar o
 * Whallet em abril (média seria faturado/4 meses, não faturado/12).
 *
 * Alertas:
 *   TRANQUILO  → < 60%
 *   ATENCAO    → 60-79%
 *   CRITICO    → 80-99%
 *   ESTOURADO  → >= 100%
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TermometroService {

    private final RecebimentoRepository recebimentoRepository;
    private final EmpresaRepository empresaRepository;

    @Transactional(readOnly = true)
    public TermometroFaturamentoResponse calcular(Usuario usuario) {
        // Busca empresa via repository (evita LazyInitializationException do proxy)
        Empresa empresa = empresaRepository.findById(usuario.getEmpresa().getId())
                .orElse(null);

        if (empresa == null) {
            return new TermometroFaturamentoResponse(
                    "NENHUM", LocalDate.now().getYear(),
                    null, BigDecimal.ZERO, 0, null,
                    BigDecimal.ZERO, BigDecimal.ZERO, 0,
                    null, "SEM_LIMITE",
                    "Empresa não encontrada. Configure nas Configurações."
            );
        }

        int anoAtual = LocalDate.now().getYear();
        LocalDate inicioAno = LocalDate.of(anoAtual, 1, 1);
        LocalDate fimAno = LocalDate.of(anoAtual, 12, 31);

        RegimeTributario regimeEnum = empresa.getRegimeTributario() != null
                ? empresa.getRegimeTributario()
                : RegimeTributario.NENHUM;
        String regime = regimeEnum.name();

        // Regime NENHUM → termômetro não faz sentido
        if (regimeEnum == RegimeTributario.NENHUM) {
            return new TermometroFaturamentoResponse(
                    regime, anoAtual,
                    null, BigDecimal.ZERO, 0, null,
                    BigDecimal.ZERO, BigDecimal.ZERO, 0,
                    null, "SEM_LIMITE",
                    "Configure o regime tributário nas Configurações pra ativar o termômetro."
            );
        }

        BigDecimal limiteAnual = empresa.getLimiteFaturamentoAnual();

        // Regime definido mas sem limite cadastrado
        if (limiteAnual == null || limiteAnual.compareTo(BigDecimal.ZERO) <= 0) {
            return new TermometroFaturamentoResponse(
                    regime, anoAtual,
                    null, BigDecimal.ZERO, 0, null,
                    BigDecimal.ZERO, BigDecimal.ZERO, 0,
                    null, "SEM_LIMITE",
                    "Configure o limite anual de faturamento nas Configurações pra ativar o termômetro."
            );
        }

        // Soma faturado no ano
        BigDecimal faturado = recebimentoRepository.somarFaturadoNoAno(
                empresa.getId(), inicioAno, fimAno);
        if (faturado == null) faturado = BigDecimal.ZERO;

        // Meses com receita
        int mesesComReceita = recebimentoRepository.contarMesesComRecebimento(
                empresa.getId(), inicioAno, fimAno);

        // Sem dados no ano
        if (mesesComReceita == 0 || faturado.compareTo(BigDecimal.ZERO) == 0) {
            return new TermometroFaturamentoResponse(
                    regime, anoAtual,
                    limiteAnual, BigDecimal.ZERO, 0,
                    limiteAnual, BigDecimal.ZERO, BigDecimal.ZERO, 0,
                    null, "SEM_DADOS",
                    "Nenhum recebimento registrado em " + anoAtual + ". O termômetro atualiza automaticamente."
            );
        }

        // Percentual
        double percentual = faturado
                .divide(limiteAnual, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();

        // Restante
        BigDecimal restante = limiteAnual.subtract(faturado).max(BigDecimal.ZERO);

        // Média mensal (baseada em meses com receita, não meses do ano)
        BigDecimal mediaMensal = faturado.divide(
                new BigDecimal(mesesComReceita), 2, RoundingMode.HALF_UP);

        // Projeção anual (média × 12)
        BigDecimal projecaoAnual = mediaMensal.multiply(new BigDecimal("12"))
                .setScale(2, RoundingMode.HALF_UP);

        // Mês de estouro (se projeção > limite)
        String mesEstouro = null;
        if (percentual < 100 && mediaMensal.compareTo(BigDecimal.ZERO) > 0) {
            // Quantos meses faltam pra estourar: restante / média mensal
            int mesesAteEstouro = restante
                    .divide(mediaMensal, 0, RoundingMode.CEILING)
                    .intValue();

            YearMonth mesProjetado = YearMonth.now().plusMonths(mesesAteEstouro);

            // Só mostra se for dentro deste ano
            if (mesProjetado.getYear() == anoAtual) {
                mesEstouro = mesProjetado.toString();  // "2026-07"
            }
        }

        // Alerta
        String alerta;
        if (percentual >= 100) alerta = "ESTOURADO";
        else if (percentual >= 80) alerta = "CRITICO";
        else if (percentual >= 60) alerta = "ATENCAO";
        else alerta = "TRANQUILO";

        // Mensagem
        String mensagem = gerarMensagem(alerta, percentual, mesEstouro, anoAtual, limiteAnual);

        log.debug("Termômetro empresa={}: {}% ({} de {}), alerta={}",
                empresa.getId(), percentual, faturado, limiteAnual, alerta);

        return new TermometroFaturamentoResponse(
                regime, anoAtual, limiteAnual, faturado, percentual,
                restante, mediaMensal, projecaoAnual, mesesComReceita,
                mesEstouro, alerta, mensagem
        );
    }

    /* ─── Helper de mensagem ──────────────────────────────────────────────── */

    private String gerarMensagem(String alerta, double percentual,
                                 String mesEstouro, int ano, BigDecimal limite) {
        return switch (alerta) {
            case "ESTOURADO" -> String.format(
                    "Atenção: você ultrapassou o limite anual de R$ %s. " +
                            "Considere migrar para Simples Nacional.",
                    formatarMoeda(limite));

            case "CRITICO" -> {
                if (mesEstouro != null) {
                    yield String.format(
                            "Cuidado: no ritmo atual, você atinge o limite em %s. " +
                                    "Considere revisar seus recebimentos.",
                            formatarMesExtenso(mesEstouro));
                }
                yield String.format(
                        "Cuidado: já usou %.0f%% do limite anual. Monitore com atenção.",
                        percentual);
            }

            case "ATENCAO" -> {
                if (mesEstouro != null) {
                    yield String.format(
                            "No ritmo atual, você atinge o limite em %s. Fique de olho.",
                            formatarMesExtenso(mesEstouro));
                }
                yield String.format("Você já faturou %.0f%% do limite anual de %d.", percentual, ano);
            }

            case "SEM_DADOS" -> "Nenhum recebimento registrado em " + ano + ".";

            case "SEM_LIMITE" -> "Configure o limite anual nas Configurações.";

            default -> String.format("Faturamento dentro do esperado (%.0f%% do limite).", percentual);
        };
    }

    /**
     * Formata "2026-07" → "julho/2026"
     */
    private String formatarMesExtenso(String anoMes) {
        try {
            YearMonth ym = YearMonth.parse(anoMes);
            String nomeMes = ym.getMonth().getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
            return nomeMes + "/" + ym.getYear();
        } catch (Exception e) {
            return anoMes;
        }
    }

    private String formatarMoeda(BigDecimal valor) {
        if (valor == null) return "0";
        return String.format("%,.2f", valor).replace(",", "X").replace(".", ",").replace("X", ".");
    }
}