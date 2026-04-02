package com.pedrocampelo.cnabportal.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadastroRequest(

        @NotBlank(message = "Nome obrigatorio")
        @Size(max = 100)
        String nome,

        @NotBlank(message = "Email obrigatorio")
        @Email(message = "Email invalido")
        String email,

        @NotBlank(message = "Senha obrigatoria")
        @Size(min = 8, message = "Senha deve ter no minimo 8 caracteres")
        String senha
) {}