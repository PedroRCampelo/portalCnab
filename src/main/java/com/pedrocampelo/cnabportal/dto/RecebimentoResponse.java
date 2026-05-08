package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.Recebimento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record RecebimentoResponse(
        UUID id,
        ClienteResumo cliente,

        String numero,                  // NOVO — agrupador de parcelas
        String descricao,
        String categoria,

        LocalDate dataEmissao,
        LocalDate dataVencimento,
        LocalDate dataRecebimento,

        BigDecimal valor,
        BigDecimal valorRecebido,
        BigDecimal saldoPendente,

        String formaPagamento,
        Integer parcelaAtual,
        Integer parcelaTotal,
        Boolean recorrente,
        String recorrenciaTipo,

        String status,
        String observacao,

        // Campos calculados — flags pra UI bloquear ações conforme estado ERP
        Boolean editavel,               // true se pode alterar (sem baixa, não cancelado)
        Boolean cancelavel,             // true se pode cancelar (sem baixa)
        Boolean estornavel,             // true se tem baixa pra estornar

        LocalDateTime criadoEm
) {

    public record ClienteResumo(
            UUID id,
            String nome,
            String telefone
    ) {}

    public static RecebimentoResponse from(Recebimento r) {
        ClienteResumo clienteResumo = r.getCliente() == null ? null
                : new ClienteResumo(
                r.getCliente().getId(),
                r.getCliente().getNome(),
                r.getCliente().getTelefone()
        );

        // Cálculo das flags de operação (regras ERP):
        boolean temBaixa     = r.temBaixa();
        boolean cancelado    = "CANCELADO".equals(r.getStatus());
        boolean editavel     = !temBaixa && !cancelado;
        boolean cancelavel   = !temBaixa && !cancelado;
        boolean estornavel   = temBaixa && !cancelado;

        return new RecebimentoResponse(
                r.getId(),
                clienteResumo,
                r.getNumero(),
                r.getDescricao(),
                r.getCategoria(),
                r.getDataEmissao(),
                r.getDataVencimento(),
                r.getDataRecebimento(),
                r.getValor(),
                r.getValorRecebido(),
                r.getSaldoPendente(),
                r.getFormaPagamento(),
                r.getParcelaAtual(),
                r.getParcelaTotal(),
                r.getRecorrente(),
                r.getRecorrenciaTipo(),
                r.getStatus(),
                r.getObservacao(),
                editavel,
                cancelavel,
                estornavel,
                r.getCriadoEm()
        );
    }
}