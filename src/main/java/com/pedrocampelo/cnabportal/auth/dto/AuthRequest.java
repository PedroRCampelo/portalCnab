package com.pedrocampelo.cnabportal.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthRequest(

        @NotBlank(message = "Email obrigatorio")
        @Email(message = "Email invalido")
        String email,

        @NotBlank(message = "Senha obrigatoria")
        String senha
) {}