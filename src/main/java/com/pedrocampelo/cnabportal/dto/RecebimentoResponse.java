package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.Recebimento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record RecebimentoResponse(
        UUID id,
        ClienteResumo cliente,

        String numero,                  // RC00001 — sequencial
        String parcela,                 // "01", "02"
        String chave,                   // RC0000101 — numero + parcela
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

        // Flags de operação pra UI
        Boolean editavel,
        Boolean cancelavel,
        Boolean estornavel,

        // Auditoria — Sprint F1.1
        AuditoriaResumo auditoria,

        LocalDateTime criadoEm
) {

    public record ClienteResumo(
            UUID id,
            String nome,
            String telefone
    ) {}

    /**
     * Resumo de auditoria — quem fez cada operação.
     * Campos nullable (só preenchidos quando a operação aconteceu).
     */
    public record AuditoriaResumo(
            String criadoPorNome,
            LocalDateTime criadoEm,
            String alteradoPorNome,
            LocalDateTime atualizadoEm,
            String baixadoPorNome,
            LocalDateTime baixadoEm,
            String canceladoPorNome,
            LocalDateTime canceladoEm
    ) {}

    public static RecebimentoResponse from(Recebimento r) {
        ClienteResumo clienteResumo = r.getCliente() == null ? null
                : new ClienteResumo(
                r.getCliente().getId(),
                r.getCliente().getNome(),
                r.getCliente().getTelefone()
        );

        boolean temBaixa     = r.temBaixa();
        boolean cancelado    = "CANCELADO".equals(r.getStatus());
        boolean editavel     = !temBaixa && !cancelado;
        boolean cancelavel   = !temBaixa && !cancelado;
        boolean estornavel   = temBaixa && !cancelado;

        // Monta auditoria (acessa lazy proxies — garantir @Transactional no caller)
        AuditoriaResumo auditoria = new AuditoriaResumo(
                r.getCriadoPor() != null ? r.getCriadoPor().getNome() : null,
                r.getCriadoEm(),
                r.getAlteradoPor() != null ? r.getAlteradoPor().getNome() : null,
                r.getAtualizadoEm(),
                r.getBaixadoPor() != null ? r.getBaixadoPor().getNome() : null,
                r.getBaixadoEm(),
                r.getCanceladoPor() != null ? r.getCanceladoPor().getNome() : null,
                r.getCanceladoEm()
        );

        return new RecebimentoResponse(
                r.getId(),
                clienteResumo,
                r.getNumero(),
                r.getParcela(),
                r.getChave(),
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
                auditoria,
                r.getCriadoEm()
        );
    }
}