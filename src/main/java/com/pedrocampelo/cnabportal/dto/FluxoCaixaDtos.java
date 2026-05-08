package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.MovimentoBancario;
import com.pedrocampelo.cnabportal.model.SaldoBancario;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTOs do módulo Fluxo de Caixa.
 * Inclui: contas bancárias, movimentos, fluxo de caixa.
 */
public final class FluxoCaixaDtos {

    private FluxoCaixaDtos() {}

    // ─────────────────────────────────────────────────────────────────────────
    // CONTAS BANCÁRIAS
    // ─────────────────────────────────────────────────────────────────────────

    public record SaldoRequest(
            @NotBlank(message = "Nome da conta é obrigatório")
            @Size(max = 100)
            String nomeConta,

            @Size(max = 50)
            String banco,

            @NotNull(message = "Saldo inicial é obrigatório")
            BigDecimal saldoInicial,

            LocalDate dataInicial,    // default = hoje no service

            Boolean principal          // default false
    ) {}

    /**
     * Atualização de cadastro da conta.
     * NÃO inclui saldoInicial — esse é imutável (use AJUSTE_MANUAL).
     */
    public record SaldoUpdateRequest(
            @NotBlank(message = "Nome da conta é obrigatório")
            @Size(max = 100)
            String nomeConta,

            @Size(max = 50)
            String banco,

            Boolean principal
    ) {}

    public record SaldoResponse(
            UUID id,
            String nomeConta,
            String banco,
            BigDecimal saldoInicial,    // imutável, registrado na criação
            LocalDate dataInicial,
            BigDecimal saldoAtual,      // CALCULADO: saldoInicial + soma(movimentos)
            Boolean principal,
            LocalDateTime atualizadoEm
    ) {
        public static SaldoResponse from(SaldoBancario s, BigDecimal saldoCalculado) {
            return new SaldoResponse(
                    s.getId(),
                    s.getNomeConta(),
                    s.getBanco(),
                    s.getSaldoInicial(),
                    s.getDataInicial(),
                    saldoCalculado != null ? saldoCalculado : s.getSaldoInicial(),
                    s.getPrincipal(),
                    s.getAtualizadoEm()
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AJUSTE MANUAL DE SALDO
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Ajusta o saldo da conta criando um movimento AJUSTE_MANUAL.
     *
     * O usuário informa o saldo "real" da conta. O sistema calcula a diferença
     * vs saldo atual e cria movimento de ajuste com o delta.
     */
    public record AjusteSaldoRequest(
            @NotNull(message = "Saldo real é obrigatório")
            BigDecimal saldoReal,

            @Size(max = 255)
            String motivo  // opcional, ex: "Conferência manual com app do banco"
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // MOVIMENTOS BANCÁRIOS
    // ─────────────────────────────────────────────────────────────────────────

    public record MovimentoResponse(
            UUID id,
            ContaResumo conta,

            LocalDate dataMovimento,
            String tipo,
            Boolean ehEntrada,
            BigDecimal valor,           // sempre positivo
            BigDecimal valorComSinal,   // negativo se saída — útil pra UI
            String descricao,

            // Origem (se houver)
            String origemTipo,
            UUID origemId,

            // Estorno (se houver)
            UUID movimentoEstornadoId,

            Boolean cancelado,
            String motivoCancelamento,

            LocalDateTime criadoEm
    ) {

        /** Mini-DTO da conta embutido no movimento (evita N+1 queries). */
        public record ContaResumo(
                UUID id,
                String nomeConta
        ) {}

        public static MovimentoResponse from(MovimentoBancario m) {
            ContaResumo conta = m.getConta() == null ? null
                    : new ContaResumo(m.getConta().getId(), m.getConta().getNomeConta());

            return new MovimentoResponse(
                    m.getId(),
                    conta,
                    m.getDataMovimento(),
                    m.getTipo(),
                    m.getEhEntrada(),
                    m.getValor(),
                    m.getValorComSinal(),
                    m.getDescricao(),
                    m.getOrigemTipo(),
                    m.getOrigemId(),
                    m.getMovimentoEstornado() != null ? m.getMovimentoEstornado().getId() : null,
                    m.getCancelado(),
                    m.getMotivoCancelamento(),
                    m.getCriadoEm()
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FLUXO DE CAIXA — SAÚDE DO MÊS
    // ─────────────────────────────────────────────────────────────────────────

    public record SaudeMesResponse(
            LocalDate inicioMes,
            LocalDate fimMes,

            BigDecimal saldoAtual,
            BigDecimal aReceberMes,
            BigDecimal aPagarMes,
            BigDecimal sobraOuFalta,

            String situacao,               // POSITIVO | NEUTRO | ATENCAO | NEGATIVO
            String mensagemSituacao,

            int qtdContasBancarias,
            int qtdRecebimentosAtrasados,
            int qtdTitulosAtrasados,

            AlertaPreditivo alertaPreditivo
    ) {}

    public record AlertaPreditivo(
            LocalDate dataCritica,
            BigDecimal saldoProjetadoNoDia,
            String mensagem,
            int diasAteCritico
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // FLUXO DE CAIXA — GRÁFICO (será usado na 2.1b)
    // ─────────────────────────────────────────────────────────────────────────

    public record PontoFluxoCaixa(
            LocalDate data,
            BigDecimal saldoProjetado,
            BigDecimal entradas,
            BigDecimal saidas
    ) {}

    public record GraficoFluxoCaixaResponse(
            LocalDate dataInicio,
            LocalDate dataFim,
            BigDecimal saldoInicial,
            List<PontoFluxoCaixa> pontos
    ) {}
}