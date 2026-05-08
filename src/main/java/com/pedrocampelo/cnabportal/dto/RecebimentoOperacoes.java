package com.pedrocampelo.cnabportal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Operações específicas sobre Recebimento.
 *
 * MUDANÇA NA PARTE 2 (Sprint 2.1a):
 *   ReceberRequest ganha o campo `contaId` (qual conta recebe o dinheiro).
 *   - Se vier null e o MEI tem 1 conta: usa essa conta
 *   - Se vier null e o MEI tem múltiplas: usa a conta principal
 *   - Se MEI não tem nenhuma conta: erro pedindo cadastrar conta primeiro
 */
public final class RecebimentoOperacoes {

    private RecebimentoOperacoes() {}

    /**
     * Request pra dar baixa (parcial ou total) num recebimento.
     */
    public record ReceberRequest(
            BigDecimal valor,           // se null, baixa o saldo todo
            LocalDate dataRecebimento,  // default = hoje
            UUID contaId                // NOVO: conta bancária onde o dinheiro entra
    ) {}

    /**
     * Request pra preview de cobrança via WhatsApp.
     */
    public record GerarCobrancaRequest(
            @NotNull(message = "Tipo de mensagem obrigatório")
            @Pattern(
                    regexp = "LEMBRETE|COBRANCA_AMIGAVEL|COBRANCA_FORMAL|COBRANCA_FIRME",
                    message = "Tipo de mensagem inválido"
            )
            String tipoMensagem,

            String mensagemCustomizada
    ) {}

    public record CobrancaWhatsappResponse(
            String mensagem,
            String linkWhatsapp,
            String telefoneCliente,
            boolean prontoParaEnvio,
            String avisoSpam
    ) {}

    public record CobrancaHistoricoResponse(
            UUID id,
            String tipoMensagem,
            String canal,
            String mensagemTexto,
            java.time.LocalDateTime enviadoEm
    ) {}
}