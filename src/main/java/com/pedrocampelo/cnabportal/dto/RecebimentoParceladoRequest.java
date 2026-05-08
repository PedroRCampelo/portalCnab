package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Request pra criação de recebimento parcelado.
 *
 * Cria N recebimentos com:
 *   - Mesmo número (agrupador)
 *   - Parcelas sequenciais (parcelaAtual = 1, 2, ..., N)
 *   - Vencimentos calculados: vencimento1, vencimento1+intervalo, vencimento1+2*intervalo...
 *   - Valor por parcela = valor / qtdParcelas (com ajuste centesimal na última parcela)
 *
 * Mesmo padrão usado em Contas a Pagar (Titulo).
 */
public record RecebimentoParceladoRequest(

        @NotNull(message = "Cliente é obrigatório")
        UUID clienteId,

        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 255)
        String descricao,

        @Size(max = 50)
        String categoria,

        @NotNull(message = "Data do primeiro vencimento é obrigatória")
        LocalDate dataVencimentoPrimeira,

        // Valor TOTAL — será dividido pelas parcelas
        @NotNull(message = "Valor é obrigatório")
        @Positive(message = "Valor deve ser maior que zero")
        BigDecimal valorTotal,

        @Min(value = 2, message = "Mínimo de 2 parcelas (use criação simples para 1)")
        @Max(value = 360, message = "Máximo de 360 parcelas")
        Integer qtdParcelas,

        @Min(value = 1, message = "Intervalo mínimo de 1 dia")
        @Max(value = 365, message = "Intervalo máximo de 365 dias")
        Integer intervaloDias,

        @Pattern(
                regexp = "PIX|BOLETO|DINHEIRO|CARTAO_CREDITO|CARTAO_DEBITO|TRANSFERENCIA|OUTROS",
                message = "Forma de pagamento inválida"
        )
        String formaPagamento,

        String observacao
) {}