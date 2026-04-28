package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.Empresa;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTOs do módulo Empresa.
 */
public final class EmpresaDtos {

    private EmpresaDtos() {}

    public record EmpresaResponse(
            UUID id,
            String nome,
            String cnpj,
            Boolean ativa,

            // Configurações MEI
            BigDecimal limiteAnualMei,
            Boolean dasAtivo,
            String dasCategoria,
            BigDecimal dasValorMensal,
            BigDecimal dasValorEfetivo
    ) {
        public static EmpresaResponse from(Empresa e, BigDecimal valorEfetivo) {
            return new EmpresaResponse(
                    e.getId(),
                    e.getNome(),
                    e.getCnpj(),
                    e.getAtiva(),
                    e.getLimiteAnualMei(),
                    e.getDasAtivo(),
                    e.getDasCategoria(),
                    e.getDasValorMensal(),
                    valorEfetivo
            );
        }
    }

    /**
     * Request de atualização da empresa.
     *
     * Sprint 2.2-A1.3: adicionado campo cnpj
     *   - Pode ser enviado com ou sem máscara (XX.XXX.XXX/XXXX-XX ou só dígitos)
     *   - Se já existe CNPJ salvo, qualquer tentativa de mudar é rejeitada
     *   - 1ª vez: valida formato + dígitos + duplicidade
     */
    public record EmpresaUpdateRequest(
            String nome,
            String cnpj,
            BigDecimal limiteAnualMei,
            Boolean dasAtivo,
            String dasCategoria,
            BigDecimal dasValorMensal,
            Boolean dasValorMensalEditado
    ) {}
}