package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO de criação/edição de Recebimento.
 *
 * cliente_id é obrigatório — backend valida que o cliente pertence à empresa.
 */
public record RecebimentoRequest(

        @NotNull(message = "Cliente é obrigatório")
        UUID clienteId,

        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 255)
        String descricao,

        @Size(max = 50)
        String categoria,

        // Datas — emissao default = hoje no service se vier null
        LocalDate dataEmissao,

        @NotNull(message = "Data de vencimento é obrigatória")
        LocalDate dataVencimento,

        // Valor
        @NotNull(message = "Valor é obrigatório")
        @Positive(message = "Valor deve ser maior que zero")
        BigDecimal valor,

        // Forma de pagamento — default PIX se null
        @Pattern(
                regexp = "PIX|BOLETO|DINHEIRO|CARTAO_CREDITO|CARTAO_DEBITO|TRANSFERENCIA|OUTROS",
                message = "Forma de pagamento inválida"
        )
        String formaPagamento,

        // Parcelamento (default 1/1 se null)
        @Min(value = 1, message = "Parcela atual deve ser >= 1")
        Integer parcelaAtual,

        @Min(value = 1, message = "Total de parcelas deve ser >= 1")
        Integer parcelaTotal,

        // Recorrência (default false)
        Boolean recorrente,

        @Pattern(
                regexp = "MENSAL|SEMANAL|QUINZENAL|ANUAL",
                message = "Tipo de recorrência inválido"
        )
        String recorrenciaTipo,

        String observacao
) {}