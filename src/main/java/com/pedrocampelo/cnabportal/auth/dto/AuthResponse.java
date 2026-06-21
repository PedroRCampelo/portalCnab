package com.pedrocampelo.cnabportal.auth.dto;

import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaResumo;
import com.pedrocampelo.cnabportal.model.Usuario.PerfilUsuario;
import java.time.LocalDate;
import java.util.UUID;

public record AuthResponse(
        String    token,
        String    tipo,
        UUID      usuarioId,
        String    nome,
        String    email,
        PerfilUsuario perfil,
        UUID      empresaId,
        long      expiraEm,
        UUID      planoId,
        boolean   emailVerificado,
        // Assinatura
        String    assinaturaStatus,
        LocalDate assinaturaExpiraEm,
        // Empresa resumida (para topbar + orçamento PDF)
        EmpresaResumo empresa
) {}
