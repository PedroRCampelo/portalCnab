package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record OrcamentoRequest(

        @NotNull(message = "Cliente é obrigatório")
        UUID clienteId,

        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 255)
        String descricao,

        String observacoes,

        LocalDate dataEmissao,

        @NotNull(message = "Validade é obrigatória")
        @FutureOrPresent(message = "Validade não pode ser no passado")
        LocalDate validade,

        @PositiveOrZero(message = "Desconto geral não pode ser negativo")
        BigDecimal descontoGeral,

        @PositiveOrZero(message = "Frete não pode ser negativo")
        BigDecimal valorFrete,

        @Size(max = 200)
        String prazoEntrega,

        @Pattern(
                regexp = "PIX|BOLETO|DINHEIRO|CARTAO_CREDITO|CARTAO_DEBITO|TRANSFERENCIA|CHEQUE|A_DEFINIR|OUTROS",
                message = "Forma de pagamento inválida"
        )
        String formaPagamento,

        @Min(value = 1, message = "Mínimo de 1 parcela")
        @Max(value = 360, message = "Máximo de 360 parcelas")
        Integer numParcelas,

        @Min(value = 1, message = "Intervalo mínimo de 1 dia")
        Integer intervaloDias,

        @NotEmpty(message = "O orçamento deve ter pelo menos um item")
        @Valid
        List<ItemRequest> itens
) {}
