package com.pedrocampelo.cnabportal.auth.dto;

import com.pedrocampelo.cnabportal.model.Usuario.PerfilUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RegisterRequest(

        @NotNull(message = "Empresa obrigatoria")
        UUID empresaId,

        @NotBlank(message = "Nome obrigatorio")
        @Size(max = 100)
        String nome,

        @NotBlank(message = "Email obrigatorio")
        @Email(message = "Email invalido")
        String email,

        // Minimo 8 caracteres — validacao de complexidade fica no service
        @NotBlank(message = "Senha obrigatoria")
        @Size(min = 8, message = "Senha deve ter no minimo 8 caracteres")
        String senha,

        // Perfil opcional — default OPERADOR se nao informado
        PerfilUsuario perfil
) {}