package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.constraints.NotBlank;

public record CargaRequest(
        @NotBlank String descricao,
        String enderecoOrigem
) {}
