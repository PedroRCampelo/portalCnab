package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.ItemPedidoVenda;
import com.pedrocampelo.cnabportal.model.PedidoVenda;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PedidoVendaResponse(
        UUID id,
        String numero,
        String status,
        String descricao,
        String observacoes,
        BigDecimal valorTotal,
        String formaPagamento,
        int numParcelas,
        int intervaloDias,
        LocalDate primeiroVencimento,
        UUID categoriaId,
        UUID orcamentoId,
        UUID cargaId,
        String cargaNumero,
        String enderecoEntrega,
        ClienteResumo cliente,
        List<ItemResumo> itens,
        boolean editavel,
        boolean efetivavel,
        boolean emCarga,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        LocalDateTime efetivadoEm,
        LocalDateTime canceladoEm
) {

    public record ClienteResumo(UUID id, String nome, String email, String documento,
                                String endereco, String cidade, String estado) {}

    public record ItemResumo(
            UUID id,
            String descricao,
            BigDecimal quantidade,
            BigDecimal valorUnitario,
            BigDecimal desconto,
            BigDecimal subtotal,
            int ordem
    ) {}

    public static PedidoVendaResponse from(PedidoVenda p) {
        var cliente = new ClienteResumo(
                p.getCliente().getId(),
                p.getCliente().getNome(),
                p.getCliente().getEmail(),
                p.getCliente().getDocumento(),
                p.getCliente().getEndereco(),
                p.getCliente().getCidade(),
                p.getCliente().getEstado()
        );

        List<ItemResumo> itens = p.getItens().stream()
                .sorted(java.util.Comparator.comparingInt(ItemPedidoVenda::getOrdem))
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

        return new PedidoVendaResponse(
                p.getId(),
                p.getNumero(),
                p.getStatus(),
                p.getDescricao(),
                p.getObservacoes(),
                p.getValorTotal(),
                p.getFormaPagamento(),
                p.getNumParcelas(),
                p.getIntervaloDias(),
                p.getPrimeiroVencimento(),
                p.getCategoriaId(),
                p.getOrcamento() != null ? p.getOrcamento().getId() : null,
                p.getCarga()    != null ? p.getCarga().getId()     : null,
                p.getCarga()    != null ? p.getCarga().getNumero() : null,
                p.getEnderecoEntrega(),
                cliente,
                itens,
                p.isEditavel(),
                p.isEfetivavel(),
                p.isEmCarga(),
                p.getCriadoEm(),
                p.getAtualizadoEm(),
                p.getEfetivadoEm(),
                p.getCanceladoEm()
        );
    }
}
