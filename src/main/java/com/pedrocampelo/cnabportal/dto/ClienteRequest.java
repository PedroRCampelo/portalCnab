package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ClienteRequest(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150)
        String nome,

        @Size(max = 20)
        String documento,

        @Pattern(regexp = "PF|PJ", message = "Tipo deve ser PF ou PJ")
        String tipoPessoa,

        LocalDate dataNascimento,

        @Size(max = 150)
        String email,

        @Size(max = 20)
        String telefone,

        @Size(max = 20)
        String whatsapp,

        @Size(max = 20)
        String telefone2,

        @Size(max = 200)
        String endereco,

        @Size(max = 100)
        String cidade,

        @Size(max = 2)
        String estado,

        @Size(max = 9)
        String cep,

        @Size(max = 50)
        String origemLead,

        @Size(max = 100)
        String responsavel,

        @Size(max = 255)
        String tags,

        @Size(max = 50)
        String categoria,

        String notas,

        @Size(max = 30)
        String setorId
) {}