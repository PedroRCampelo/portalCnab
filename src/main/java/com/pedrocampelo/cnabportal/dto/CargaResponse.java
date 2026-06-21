package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.Carga;
import com.pedrocampelo.cnabportal.model.PedidoVenda;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CargaResponse(
        UUID   id,
        String numero,
        String descricao,
        String status,
        String enderecoOrigem,
        int    totalPedidos,
        BigDecimal valorTotal,
        List<PedidoResumo> pedidos,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {

    public record PedidoResumo(
            UUID       id,
            String     numero,
            String     clienteNome,
            BigDecimal valorTotal,
            String     enderecoEntrega,
            String     status
    ) {}

    public static CargaResponse from(Carga c) {
        List<PedidoResumo> pedidos = c.getPedidos().stream()
                .map(p -> new PedidoResumo(
                        p.getId(),
                        p.getNumero(),
                        p.getCliente() != null ? p.getCliente().getNome() : "—",
                        p.getValorTotal(),
                        p.getEnderecoEntrega(),
                        p.getStatus()
                ))
                .toList();

        BigDecimal total = c.getPedidos().stream()
                .map(PedidoVenda::getValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CargaResponse(
                c.getId(),
                c.getNumero(),
                c.getDescricao(),
                c.getStatus(),
                c.getEnderecoOrigem(),
                pedidos.size(),
                total,
                pedidos,
                c.getCriadoEm(),
                c.getAtualizadoEm()
        );
    }
}
