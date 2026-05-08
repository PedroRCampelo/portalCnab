package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.Cliente;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de saída — espelha Cliente + dados calculados (estatísticas).
 *
 * Não retornamos a entidade JPA direto pra:
 *   - Não vazar empresa_id
 *   - Adicionar campos calculados (total recebido, score)
 *   - Controlar formato (telefone formatado, etc)
 */
public record ClienteResponse(
        UUID id,
        String nome,
        String documento,
        String tipoPessoa,
        String email,
        String telefone,
        String telefoneFormatado,   // ex: "(11) 98765-4321"
        String categoria,
        String notas,
        Boolean ativo,
        LocalDateTime criadoEm,

        // Estatísticas calculadas (preenchidas só na visão detalhada do cliente)
        Estatisticas estatisticas
) {

    public record Estatisticas(
            long totalRecebimentos,         // quantos recebimentos no histórico
            long recebimentosAtrasados,     // ATRASADO
            long recebimentosPagos,         // RECEBIDO
            BigDecimal valorTotalRecebido,
            BigDecimal valorTotalAtrasado,
            String score                    // BOM | ATENCAO | INADIMPLENTE
    ) {}

    /**
     * Factory: cria response a partir da entidade, sem estatísticas.
     * Usado em listagens (cálculo de stats por item seria caro).
     */
    public static ClienteResponse from(Cliente c) {
        return new ClienteResponse(
                c.getId(),
                c.getNome(),
                c.getDocumento(),
                c.getTipoPessoa(),
                c.getEmail(),
                c.getTelefone(),
                formatarTelefone(c.getTelefone()),
                c.getCategoria(),
                c.getNotas(),
                c.getAtivo(),
                c.getCriadoEm(),
                null  // sem estatísticas
        );
    }

    /**
     * Factory com estatísticas — usado no detalhe do cliente.
     */
    public static ClienteResponse from(Cliente c, Estatisticas stats) {
        return new ClienteResponse(
                c.getId(),
                c.getNome(),
                c.getDocumento(),
                c.getTipoPessoa(),
                c.getEmail(),
                c.getTelefone(),
                formatarTelefone(c.getTelefone()),
                c.getCategoria(),
                c.getNotas(),
                c.getAtivo(),
                c.getCriadoEm(),
                stats
        );
    }

    /**
     * Formata telefone armazenado (só dígitos) pra display.
     * 11 dígitos → "(XX) XXXXX-XXXX" (celular)
     * 10 dígitos → "(XX) XXXX-XXXX" (fixo)
     * Outro → retorna como está (defesa contra dados estranhos)
     */
    private static String formatarTelefone(String tel) {
        if (tel == null || tel.isBlank()) return "";
        String digitos = tel.replaceAll("\\D", "");
        if (digitos.length() == 11) {
            return String.format("(%s) %s-%s",
                    digitos.substring(0, 2),
                    digitos.substring(2, 7),
                    digitos.substring(7));
        }
        if (digitos.length() == 10) {
            return String.format("(%s) %s-%s",
                    digitos.substring(0, 2),
                    digitos.substring(2, 6),
                    digitos.substring(6));
        }
        return tel;
    }
}