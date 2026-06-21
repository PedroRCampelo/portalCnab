package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ItemRequest(

        @NotBlank(message = "Descrição do item é obrigatória")
        String descricao,

        @Positive(message = "Quantidade deve ser maior que zero")
        BigDecimal quantidade,

        @Positive(message = "Valor unitário deve ser maior que zero")
        BigDecimal valorUnitario,

        @PositiveOrZero(message = "Desconto não pode ser negativo")
        BigDecimal desconto,

        Integer ordem
) {}
