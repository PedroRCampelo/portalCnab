package com.pedrocampelo.cnabportal.service.recebimentossv;

import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.CobrancaHistoricoResponse;
import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.CobrancaWhatsappResponse;
import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.GerarCobrancaRequest;
import com.pedrocampelo.cnabportal.model.CobrancaEnviada;
import com.pedrocampelo.cnabportal.model.Recebimento;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.CobrancaEnviadaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Geração e envio (via wa.me link) de cobranças WhatsApp.
 *
 * Fluxo:
 *   1. Frontend chama /recebimentos/{id}/cobranca/preview com tipo
 *   2. Service gera mensagem + link wa.me
 *   3. Frontend abre link (popup/nova aba) — usuário envia no WhatsApp
 *   4. Frontend chama /recebimentos/{id}/cobranca/registrar
 *      pra marcar que cobrou (auditoria/score)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CobrancaService {

    private final RecebimentoService          recebimentoService;
    private final CobrancaEnviadaRepository   cobrancaRepository;

    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ── Geração da mensagem (preview) ─────────────────────────────────────────

    public CobrancaWhatsappResponse gerarPreview(Usuario usuario, UUID recebimentoId,
                                                 GerarCobrancaRequest request) {
        Recebimento r = recebimentoService.buscarEntidadePorId(usuario, recebimentoId);

        // Se cliente não tem telefone, não dá pra cobrar via WhatsApp
        String telefoneCliente = r.getCliente().getTelefone();
        boolean temTelefone = telefoneCliente != null && !telefoneCliente.isBlank();

        // Mensagem: customizada (se preenchida) ou template
        String mensagem = (request.mensagemCustomizada() != null
                && !request.mensagemCustomizada().isBlank())
                ? request.mensagemCustomizada()
                : montarMensagemTemplate(r, request.tipoMensagem());

        // Aviso anti-spam — verifica cobrança nas últimas 24h
        long cobrancasUltimas24h = cobrancaRepository.countByRecebimentoIdAndEnviadoEmAfter(
                r.getId(), LocalDateTime.now().minus(24, ChronoUnit.HOURS)
        );
        String avisoSpam = cobrancasUltimas24h > 0
                ? "⚠️ Você já cobrou esse cliente nas últimas 24h. Tem certeza?"
                : null;

        // Link wa.me — formato internacional, sem +, sem traço
        String linkWhatsapp = temTelefone
                ? construirLinkWaMe(telefoneCliente, mensagem)
                : null;

        return new CobrancaWhatsappResponse(
                mensagem,
                linkWhatsapp,
                formatarTelefoneExibicao(telefoneCliente),
                temTelefone,
                avisoSpam
        );
    }

    // ── Registro do envio (auditoria + score) ─────────────────────────────────

    @Transactional
    public void registrarEnvio(Usuario usuario, UUID recebimentoId, GerarCobrancaRequest request) {
        Recebimento r = recebimentoService.buscarEntidadePorId(usuario, recebimentoId);

        String mensagemSalva = (request.mensagemCustomizada() != null
                && !request.mensagemCustomizada().isBlank())
                ? request.mensagemCustomizada()
                : montarMensagemTemplate(r, request.tipoMensagem());

        CobrancaEnviada cobranca = CobrancaEnviada.builder()
                .recebimento(r)
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .tipoMensagem(request.tipoMensagem())
                .canal("WHATSAPP")
                .mensagemTexto(mensagemSalva)
                .build();

        cobrancaRepository.save(cobranca);
        log.info("Cobrança registrada: recebimento={}, tipo={}, cliente={}",
                r.getId(), request.tipoMensagem(), r.getCliente().getNome());
    }

    // ── Histórico de cobranças do recebimento ─────────────────────────────────

    public List<CobrancaHistoricoResponse> historico(Usuario usuario, UUID recebimentoId) {
        // Validação implícita: se não pertence ao usuário, lança NoSuchElement
        recebimentoService.buscarEntidadePorId(usuario, recebimentoId);

        return cobrancaRepository.findByRecebimentoIdOrderByEnviadoEmDesc(recebimentoId)
                .stream()
                .map(c -> new CobrancaHistoricoResponse(
                        c.getId(),
                        c.getTipoMensagem(),
                        c.getCanal(),
                        c.getMensagemTexto(),
                        c.getEnviadoEm()
                ))
                .toList();
    }

    // ── Templates de mensagem ─────────────────────────────────────────────────

    /**
     * Monta a mensagem de cobrança baseada no tipo escolhido.
     * Variáveis substituídas no texto:
     *   {{cliente}}    → primeiro nome do cliente
     *   {{valor}}      → valor pendente formatado (R$ 500,00)
     *   {{vencimento}} → data formatada DD/MM/AAAA
     *   {{descricao}}  → descrição do recebimento
     *   {{diasAtraso}} → dias de atraso (só pra COBRANCA_FORMAL/FIRME)
     */
    private String montarMensagemTemplate(Recebimento r, String tipo) {
        String primeiroNome = extrairPrimeiroNome(r.getCliente().getNome());
        String valor = formatarValor(r.getSaldoPendente());
        String vencimento = r.getDataVencimento().format(DATA_BR);
        long diasAtraso = ChronoUnit.DAYS.between(r.getDataVencimento(), LocalDate.now());

        return switch (tipo) {
            case "LEMBRETE" -> String.format(
                    "Oi %s, tudo bem? 😊%n%n"
                            + "Passando aqui só pra lembrar do nosso combinado de %s referente a \"%s\", "
                            + "que vence em %s.%n%n"
                            + "Qualquer dúvida tô à disposição!",
                    primeiroNome, valor, r.getDescricao(), vencimento
            );

            case "COBRANCA_AMIGAVEL" -> String.format(
                    "Olá %s! 👋%n%n"
                            + "Notei que o pagamento de %s referente a \"%s\" venceu em %s.%n%n"
                            + "Será que você consegue me retornar pra acertarmos? "
                            + "Qualquer coisa, tô por aqui pra ajudar!",
                    primeiroNome, valor, r.getDescricao(), vencimento
            );

            case "COBRANCA_FORMAL" -> String.format(
                    "Olá %s.%n%n"
                            + "Estou entrando em contato sobre o pagamento de %s referente a \"%s\", "
                            + "que está em atraso há %d dias (vencimento em %s).%n%n"
                            + "Por favor, me retorne hoje pra resolvermos a regularização.",
                    primeiroNome, valor, r.getDescricao(), diasAtraso, vencimento
            );

            case "COBRANCA_FIRME" -> String.format(
                    "Olá %s.%n%n"
                            + "Já tentei contato sobre o pagamento de %s referente a \"%s\", "
                            + "atrasado há %d dias.%n%n"
                            + "Preciso resolver essa pendência hoje. Por favor, me retorne com urgência "
                            + "para evitarmos medidas adicionais.",
                    primeiroNome, valor, r.getDescricao(), diasAtraso
            );

            default -> throw new IllegalArgumentException("Tipo de mensagem inválido: " + tipo);
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String construirLinkWaMe(String telefone, String mensagem) {
        // Normaliza telefone: só dígitos, prepend 55 (Brasil) se não tiver
        String digitos = telefone.replaceAll("\\D", "");
        if (!digitos.startsWith("55")) {
            digitos = "55" + digitos;
        }
        String mensagemEncoded = URLEncoder.encode(mensagem, StandardCharsets.UTF_8);
        return "https://wa.me/" + digitos + "?text=" + mensagemEncoded;
    }

    private String formatarTelefoneExibicao(String tel) {
        if (tel == null || tel.isBlank()) return "";
        String digitos = tel.replaceAll("\\D", "");
        if (digitos.length() == 11) {
            return String.format("(%s) %s-%s",
                    digitos.substring(0, 2), digitos.substring(2, 7), digitos.substring(7));
        }
        if (digitos.length() == 10) {
            return String.format("(%s) %s-%s",
                    digitos.substring(0, 2), digitos.substring(2, 6), digitos.substring(6));
        }
        return tel;
    }

    private String extrairPrimeiroNome(String nomeCompleto) {
        if (nomeCompleto == null || nomeCompleto.isBlank()) return "";
        return nomeCompleto.trim().split("\\s+")[0];
    }

    private String formatarValor(java.math.BigDecimal valor) {
        return String.format("R$ %,.2f", valor)
                .replace(",", "X").replace(".", ",").replace("X", ".");
    }
}