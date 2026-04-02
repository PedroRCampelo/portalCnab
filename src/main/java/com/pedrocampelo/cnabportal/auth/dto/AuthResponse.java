package com.pedrocampelo.cnabportal.auth.dto;

import com.pedrocampelo.cnabportal.model.Usuario.PerfilUsuario;

import java.util.UUID;

// Retornado no login bem-sucedido
// Inclui dados suficientes para o frontend montar a sessão sem consultas extras
public record AuthResponse(
        String token,
        String tipo,         // sempre "Bearer"
        UUID   usuarioId,
        String nome,
        String email,
        PerfilUsuario perfil,
        UUID   empresaId,
        long   expiraEm     // timestamp Unix em ms
) {}