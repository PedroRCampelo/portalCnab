package com.pedrocampelo.cnabportal.auth.dto;

import com.pedrocampelo.cnabportal.model.Usuario.PerfilUsuario;

import java.util.UUID;

public record AuthResponse(
        String token,
        String tipo,
        UUID   usuarioId,
        String nome,
        String email,
        PerfilUsuario perfil,
        UUID   empresaId,
        long   expiraEm,
        UUID   planoId
) {}