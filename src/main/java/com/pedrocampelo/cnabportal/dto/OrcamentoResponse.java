package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.ItemOrcamento;
import com.pedrocampelo.cnabportal.model.Orcamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrcamentoResponse(
        UUID id,
        String numero,
        String status,
        LocalDate dataEmissao,
        LocalDate validade,
        String descricao,
        String observacoes,
        BigDecimal valorTotal,
        BigDecimal descontoGeral,
        BigDecimal valorFrete,
        String prazoEntrega,
        String formaPagamento,
        int numParcelas,
        int intervaloDias,
        ClienteResumo cliente,
        List<ItemResumo> itens,
        boolean editavel,
        boolean expirado,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        LocalDateTime aprovadoEm,
        LocalDateTime canceladoEm
) {

    public record ClienteResumo(UUID id, String nome, String email, String documento) {}

    public record ItemResumo(
            UUID id,
            String descricao,
            BigDecimal quantidade,
            BigDecimal valorUnitario,
            BigDecimal desconto,
            BigDecimal subtotal,
            int ordem
    ) {}

    public static OrcamentoResponse from(Orcamento o) {
        var cliente = new ClienteResumo(
                o.getCliente().getId(),
                o.getCliente().getNome(),
                o.getCliente().getEmail(),
                o.getCliente().getDocumento()
        );

        List<ItemResumo> itens = o.getItens().stream()
                .sorted(java.util.Comparator.comparingInt(ItemOrcamento::getOrdem))
                .map(i -> new ItemResumo(
                        i.getId(),
                        i.getDescricao(),
                        i.getQuantidade(),
                        i.getValorUnitario(),
                        i.getDesconto(),
                        i.getSubtotal(),
                        i.getOrdem()
                ))
                .toList();

        return new OrcamentoResponse(
                o.getId(),
                o.getNumero(),
                o.getStatus(),
                o.getDataEmissao(),
                o.getValidade(),
                o.getDescricao(),
                o.getObservacoes(),
                o.getValorTotal(),
                o.getDescontoGeral(),
                o.getValorFrete() != null ? o.getValorFrete() : java.math.BigDecimal.ZERO,
                o.getPrazoEntrega(),
                o.getFormaPagamento(),
                o.getNumParcelas(),
                o.getIntervaloDias(),
                cliente,
                itens,
                o.isEditavel(),
                o.isExpirado(),
                o.getCriadoEm(),
                o.getAtualizadoEm(),
                o.getAprovadoEm(),
                o.getCanceladoEm()
        );
    }
}
