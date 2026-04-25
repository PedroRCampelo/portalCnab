package com.pedrocampelo.cnabportal.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO recebido do frontend após o usuário autenticar no botão "Sign in with Google".
 *
 * O `idToken` é um JWT assinado pelo Google. O backend valida a assinatura
 * usando a chave pública do Google antes de confiar em qualquer claim.
 */
public record GoogleAuthRequest(
        @NotBlank(message = "ID Token é obrigatório")
        String idToken
) {}