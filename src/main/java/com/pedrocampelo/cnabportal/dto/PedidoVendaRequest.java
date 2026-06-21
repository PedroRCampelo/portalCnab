package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PedidoVendaRequest(

        @NotNull(message = "Cliente é obrigatório")
        UUID clienteId,

        UUID orcamentoId,

        @Size(max = 255)
        String descricao,

        String observacoes,

        @Pattern(
                regexp = "PIX|BOLETO|DINHEIRO|CARTAO_CREDITO|CARTAO_DEBITO|TRANSFERENCIA|OUTROS",
                message = "Forma de pagamento inválida"
        )
        String formaPagamento,

        @Min(value = 1, message = "Mínimo de 1 parcela")
        @Max(value = 360, message = "Máximo de 360 parcelas")
        Integer numParcelas,

        @Min(value = 1, message = "Intervalo mínimo de 1 dia")
        Integer intervaloDias,

        @NotNull(message = "Primeiro vencimento é obrigatório")
        LocalDate primeiroVencimento,

        UUID categoriaId,

        @NotEmpty(message = "O pedido deve ter pelo menos um item")
        @Valid
        List<ItemRequest> itens
) {}
