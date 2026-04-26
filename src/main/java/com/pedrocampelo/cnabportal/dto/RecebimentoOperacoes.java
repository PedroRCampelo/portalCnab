package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Operações específicas sobre Recebimento.
 * Agrupei aqui pra não criar 5 arquivos pequenos.
 */
public final class RecebimentoOperacoes {

    private RecebimentoOperacoes() {}

    /**
     * Request pra dar baixa (parcial ou total) num recebimento.
     *
     * Se valor for null/igual ao saldo → considera baixa total.
     * Se valor < saldo → baixa parcial, recebimento fica PARCIAL.
     */
    public record ReceberRequest(
            BigDecimal valor,           // se null, baixa o saldo todo
            LocalDate dataRecebimento   // default = hoje
    ) {}

    /**
     * Request pra preview de cobrança via WhatsApp.
     * O backend GERA a mensagem (de acordo com tipo) e retorna o link wa.me.
     * Frontend abre o link em nova aba — usuário envia.
     */
    public record GerarCobrancaRequest(
            @NotNull(message = "Tipo de mensagem obrigatório")
            @Pattern(
                    regexp = "LEMBRETE|COBRANCA_AMIGAVEL|COBRANCA_FORMAL|COBRANCA_FIRME",
                    message = "Tipo de mensagem inválido"
            )
            String tipoMensagem,

            // Opcional — se preenchido, sobrescreve o template padrão
            String mensagemCustomizada
    ) {}

    /**
     * Response da geração de cobrança WhatsApp.
     */
    public record CobrancaWhatsappResponse(
            String mensagem,        // texto final que será enviado
            String linkWhatsapp,    // ex: https://wa.me/5511987654321?text=...
            String telefoneCliente, // formatado pra exibição
            boolean prontoParaEnvio,// false se não tem telefone do cliente
            String avisoSpam        // null OU "Você já cobrou esse cliente nas últimas 24h"
    ) {}

    /**
     * Histórico de cobrança enviada (item da timeline).
     */
    public record CobrancaHistoricoResponse(
            UUID id,
            String tipoMensagem,
            String canal,
            String mensagemTexto,
            java.time.LocalDateTime enviadoEm
    ) {}
}