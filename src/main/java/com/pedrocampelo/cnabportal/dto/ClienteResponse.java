package com.pedrocampelo.cnabportal.dto;

import com.pedrocampelo.cnabportal.model.Cliente;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ClienteResponse(
        UUID id,
        String nome,
        String documento,
        String tipoPessoa,
        LocalDate dataNascimento,
        String email,
        String telefone,
        String telefoneFormatado,
        String whatsapp,
        String whatsappFormatado,
        String telefone2,
        String endereco,
        String cidade,
        String estado,
        String cep,
        String origemLead,
        String responsavel,
        String tags,
        String categoria,
        String notas,
        String setorId,
        String score,
        LocalDateTime dataUltimoContato,
        Boolean ativo,
        LocalDateTime criadoEm,
        Estatisticas estatisticas
) {

    public record Estatisticas(
            long totalRecebimentos,
            long recebimentosAtrasados,
            long recebimentosPagos,
            BigDecimal valorTotalRecebido,
            BigDecimal valorTotalAtrasado,
            String score
    ) {}

    public static ClienteResponse from(Cliente c) {
        return new ClienteResponse(
                c.getId(), c.getNome(), c.getDocumento(), c.getTipoPessoa(),
                c.getDataNascimento(), c.getEmail(), c.getTelefone(),
                fmtTel(c.getTelefone()), c.getWhatsapp(), fmtTel(c.getWhatsapp()),
                c.getTelefone2(), c.getEndereco(), c.getCidade(), c.getEstado(),
                c.getCep(), c.getOrigemLead(), c.getResponsavel(), c.getTags(),
                c.getCategoria(), c.getNotas(), c.getSetorId(), c.getScore(),
                c.getDataUltimoContato(), c.getAtivo(), c.getCriadoEm(), null
        );
    }

    public static ClienteResponse from(Cliente c, Estatisticas stats) {
        return new ClienteResponse(
                c.getId(), c.getNome(), c.getDocumento(), c.getTipoPessoa(),
                c.getDataNascimento(), c.getEmail(), c.getTelefone(),
                fmtTel(c.getTelefone()), c.getWhatsapp(), fmtTel(c.getWhatsapp()),
                c.getTelefone2(), c.getEndereco(), c.getCidade(), c.getEstado(),
                c.getCep(), c.getOrigemLead(), c.getResponsavel(), c.getTags(),
                c.getCategoria(), c.getNotas(), c.getSetorId(), c.getScore(),
                c.getDataUltimoContato(), c.getAtivo(), c.getCriadoEm(), stats
        );
    }

    private static String fmtTel(String tel) {
        if (tel == null || tel.isBlank()) return "";
        String d = tel.replaceAll("\\D", "");
        if (d.length() == 11) return String.format("(%s) %s-%s", d.substring(0,2), d.substring(2,7), d.substring(7));
        if (d.length() == 10) return String.format("(%s) %s-%s", d.substring(0,2), d.substring(2,6), d.substring(6));
        return tel;
    }
}