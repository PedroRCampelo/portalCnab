package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada pra criação/edição de Cliente.
 *
 * Note que NÃO recebemos empresa_id — a empresa vem do usuário autenticado.
 * Isso evita o frontend "passar" um empresa_id de outra empresa (IDOR).
 */
public record ClienteRequest(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome muito longo (máx 150)")
        String nome,

        @Size(max = 20, message = "Documento muito longo")
        String documento,  // opcional — CPF (11) ou CNPJ (14), só dígitos

        @Pattern(regexp = "PF|PJ", message = "Tipo de pessoa deve ser PF ou PJ")
        String tipoPessoa,  // opcional — default PF no service

        @Size(max = 150, message = "Email muito longo")
        String email,  // opcional

        @Size(max = 20, message = "Telefone muito longo")
        String telefone,  // opcional, mas necessário pra cobrança WhatsApp

        @Size(max = 50, message = "Categoria muito longa")
        String categoria,

        String notas
) {}