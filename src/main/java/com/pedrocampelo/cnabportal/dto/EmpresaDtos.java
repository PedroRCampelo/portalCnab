package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.CategoriaMei;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.RegimeTributario;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTOs do módulo Empresa.
 *
 * Sprint 2.2-A1.5: refatoração para regime tributário escalável.
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

            // Regime tributário
            RegimeTributario regimeTributario,
            BigDecimal limiteFaturamentoAnual,

            // Sub-campos MEI
            CategoriaMei meiCategoria,
            BigDecimal meiValorDasMensal,

            // DAS
            Boolean dasAtivo,
            BigDecimal dasValorEfetivo    // calculado pelo service
    ) {
        public static EmpresaResponse from(Empresa e, BigDecimal valorEfetivo) {
            return new EmpresaResponse(
                    e.getId(),
                    e.getNome(),
                    e.getCnpj(),
                    e.getAtiva(),
                    e.getRegimeTributario(),
                    e.getLimiteFaturamentoAnual(),
                    e.getMeiCategoria(),
                    e.getMeiValorDasMensal(),
                    e.getDasAtivo(),
                    valorEfetivo
            );
        }
    }

    /**
     * Request de atualização da empresa.
     *
     * Todos os campos são opcionais (null = não atualiza).
     *
     * Mudanças Sprint 2.2-A1.5:
     *   - regimeTributario: substitui flag implícita "isMei"
     *   - limiteFaturamentoAnual: substitui limiteAnualMei
     *   - meiCategoria + meiValorDasMensal: substituem dasCategoria + dasValorMensal
     */
    public record EmpresaUpdateRequest(
            String nome,
            String cnpj,
            RegimeTributario regimeTributario,
            BigDecimal limiteFaturamentoAnual,
            CategoriaMei meiCategoria,
            BigDecimal meiValorDasMensal,
            Boolean meiValorDasMensalEditado,  // flag explícita (null vs reset)
            Boolean dasAtivo
    ) {}
}