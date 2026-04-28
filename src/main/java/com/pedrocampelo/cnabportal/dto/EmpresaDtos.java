package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.Empresa;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTOs do módulo Empresa.
 *
 * Namespace pra agrupar request/response da empresa.
 */
public final class EmpresaDtos {

    private EmpresaDtos() {}

    /**
     * Resposta com dados da empresa do MEI logado.
     */
    public record EmpresaResponse(
            UUID id,
            String nome,
            String cnpj,
            Boolean ativa,

            // Configurações MEI
            BigDecimal limiteAnualMei,
            Boolean dasAtivo,
            String dasCategoria,
            BigDecimal dasValorMensal,    // null = usar padrão da categoria
            BigDecimal dasValorEfetivo    // valor que o sistema usará (calculado)
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
     * Todos os campos são opcionais (null = não atualiza).
     *
     * Sobre dasValorMensal:
     *   - Quando dasValorMensalEditado=true e dasValorMensal=null → volta pro padrão
     *   - Quando dasValorMensalEditado=true e dasValorMensal=valor → usa esse valor
     *   - Quando dasValorMensalEditado=false ou null → mantém valor atual
     *   (este flag é necessário porque "null" no request seria ambíguo)
     */
    public record EmpresaUpdateRequest(
            String nome,
            BigDecimal limiteAnualMei,
            Boolean dasAtivo,
            String dasCategoria,
            BigDecimal dasValorMensal,
            Boolean dasValorMensalEditado  // flag explícita pra distinguir "não mexer" de "limpar"
    ) {}
}