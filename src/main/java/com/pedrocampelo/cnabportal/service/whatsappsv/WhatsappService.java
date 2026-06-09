package com.pedrocampelo.cnabportal.service.whatsappsv;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.ReceberRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoResponse;
import com.pedrocampelo.cnabportal.model.*;
import com.pedrocampelo.cnabportal.repository.*;
import com.pedrocampelo.cnabportal.service.gestaosv.TituloService;
import com.pedrocampelo.cnabportal.service.recebimentossv.RecebimentoService;
import com.pedrocampelo.cnabportal.service.whatsappsv.WhatsappAIService.AcaoInterpretada;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsappService {

    private final UsuarioRepository usuarioRepository;
    private final WhatsappSessaoRepository sessaoRepository;
    private final WhatsappMensagemRepository mensagemRepository;
    private final WhatsappAIService aiService;
    private final WhatsappAudioService audioService;
    private final SaldoBancarioRepository saldoRepository;
    private final TituloRepository tituloRepository;
    private final RecebimentoRepository recebimentoRepository;
    private final ClienteRepository clienteRepository;
    private final RecebimentoService recebimentoService;
    private final TituloService tituloService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${whatsapp.evolution.url:http://157.245.90.220:8080}")
    private String evolutionUrl;
    @Value("${whatsapp.evolution.apikey:}")
    private String evolutionApiKey;
    @Value("${whatsapp.evolution.instance:whallet}")
    private String evolutionInstance;

    private static final int RATE_LIMIT_POR_HORA = 30;
    private static final int TIMEOUT_MINUTOS = 10;
    private static final int CODIGO_EXPIRA_MINUTOS = 5;

    // ═══ VINCULAÇÃO ══════════════════════════════════════════════════════════

    @Transactional
    public void iniciarVinculacao(Usuario usuario, String telefoneRaw) {
        String telefone = telefoneRaw.replaceAll("\\D", "");
        if (!telefone.startsWith("55")) telefone = "55" + telefone;
        if (telefone.length() < 12 || telefone.length() > 13)
            throw new IllegalArgumentException("Número inválido.");

        sessaoRepository.findByTelefoneAndAtivaTrue(telefone).ifPresent(s -> {
            // Se pertence a outro usuário (verificada ou não) → bloquear
            if (!s.getUsuarioId().equals(usuario.getId())) {
                throw new IllegalArgumentException(
                        "Este número já está vinculado a outra conta. Desvincule primeiro na conta original.");
            }
            s.setAtiva(false); sessaoRepository.save(s);
        });

        String codigo = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 999999));
        sessaoRepository.save(WhatsappSessao.builder()
                .usuarioId(usuario.getId()).empresaId(usuario.getEmpresa().getId())
                .telefone(telefone).codigoVerificacao(codigo)
                .codigoExpiraEm(LocalDateTime.now().plusMinutes(CODIGO_EXPIRA_MINUTOS))
                .verificada(false).ativa(true).build());

        enviarMensagem(telefone,
                "🔐 *Código Whallet*\n\nSeu código: *" + codigo + "*\n\nResponda com o código.\n⏱️ Expira em " + CODIGO_EXPIRA_MINUTOS + " min.");
    }

    // ═══ WEBHOOK ═════════════════════════════════════════════════════════════

    @SuppressWarnings("unchecked")
    public void processarMensagem(Map<String, Object> payload) {
        try {
            var data = (Map<String, Object>) payload.get("data");
            if (data == null) return;
            var key = (Map<String, Object>) data.get("key");
            if (key == null || Boolean.TRUE.equals(key.get("fromMe"))) return;
            String remoteJid = (String) key.get("remoteJid");
            if (remoteJid == null) return;
            String lid = remoteJid.split("@")[0];
            String messageId = (String) key.get("id");

            var message = (Map<String, Object>) data.get("message");
            String messageType = (String) data.get("messageType");

            String texto = null;
            boolean isAudio = false;

            if ("audioMessage".equals(messageType) && message != null && message.containsKey("audioMessage")) {
                log.info("[WhatsApp] Áudio recebido de {}, transcrevendo...", lid);
                texto = audioService.transcrever(remoteJid, messageId);
                isAudio = true;
                if (texto == null || texto.isBlank()) {
                    Optional<WhatsappSessao> sessaoOpt = sessaoRepository.findByLidAndVerificadaTrueAndAtivaTrue(lid);
                    if (sessaoOpt.isPresent())
                        enviarMensagem(sessaoOpt.get().getTelefone(), "🎙️ Não consegui entender o áudio. Tente novamente ou envie por texto.");
                    return;
                }
                log.info("[WhatsApp] Transcrição: \"{}\"", texto);
            } else {
                texto = extrairTexto(message);
            }

            if (texto == null || texto.isBlank()) return;
            log.info("[WhatsApp] {} de {}: {}", isAudio ? "Áudio" : "Texto", lid, texto);

            Optional<WhatsappSessao> sessaoOpt = sessaoRepository.findByLidAndVerificadaTrueAndAtivaTrue(lid);
            if (sessaoOpt.isPresent()) { processarMensagemVinculada(sessaoOpt.get(), texto, isAudio); return; }

            // Auto-link: sessão verificada pela web (sem LID) → primeira msg no WhatsApp completa o vínculo
            List<WhatsappSessao> semLid = sessaoRepository.findAll().stream()
                    .filter(s -> Boolean.TRUE.equals(s.getAtiva())
                            && Boolean.TRUE.equals(s.getVerificada())
                            && (s.getLid() == null || s.getLid().isBlank()))
                    .toList();
            if (semLid.size() == 1) {
                WhatsappSessao s = semLid.get(0);
                s.setLid(lid);
                s.setUltimaMensagemEm(LocalDateTime.now());
                sessaoRepository.save(s);
                log.info("[WhatsApp] Auto-link: LID {} → sessão {} (verificação web)", lid, s.getId());
                processarMensagemVinculada(s, texto, isAudio);
                return;
            }

            String possivelCodigo = texto.trim().replaceAll("\\s", "");
            if (possivelCodigo.matches("\\d{6}")) { tentarVerificar(lid, possivelCodigo); return; }

            // Mensagem de instrução para não cadastrados
            log.warn("[WhatsApp] LID {} não vinculado", lid);
            String sender = (String) payload.get("sender");
            if (sender != null) {
                String numSender = sender.split("@")[0];
                enviarMensagem(numSender,
                        "👋 Olá! Sou o assistente financeiro da *Whallet*.\n\n" +
                                "Para usar, você precisa vincular seu WhatsApp na plataforma:\n\n" +
                                "1️⃣ Acesse *whallet.com.br*\n" +
                                "2️⃣ Vá em *WhatsApp Bot* no menu lateral\n" +
                                "3️⃣ Digite seu número e confirme o código\n\n" +
                                "Após vincular, é só mandar comandos como:\n💸 \"Gastei 200 na padaria\"\n💰 \"Recebi 1500 do João\"");
            }

        } catch (Exception e) { log.error("[WhatsApp] Erro: {}", e.getMessage(), e); }
    }

    // ═══ VERIFICAÇÃO ═════════════════════════════════════════════════════════

    @Transactional
    public void tentarVerificar(String lid, String codigo) {
        List<WhatsappSessao> pendentes = sessaoRepository.findAll().stream()
                .filter(s -> Boolean.TRUE.equals(s.getAtiva()) && !Boolean.TRUE.equals(s.getVerificada()))
                .filter(s -> codigo.equals(s.getCodigoVerificacao())).toList();
        if (pendentes.isEmpty()) return;

        WhatsappSessao sessao = pendentes.get(0);
        if (sessao.getCodigoExpiraEm() != null && LocalDateTime.now().isAfter(sessao.getCodigoExpiraEm())) {
            enviarMensagem(sessao.getTelefone(), "⏱️ Código expirado.");
            sessao.setAtiva(false); sessaoRepository.save(sessao); return;
        }

        sessao.setLid(lid); sessao.setVerificada(true); sessao.setCodigoVerificacao(null);
        sessao.setUltimaMensagemEm(LocalDateTime.now()); sessaoRepository.save(sessao);

        usuarioRepository.findById(sessao.getUsuarioId()).ifPresent(u -> {
            String tel = sessao.getTelefone().startsWith("55") ? sessao.getTelefone().substring(2) : sessao.getTelefone();
            if (u.getTelefone() == null || !u.getTelefone().equals(tel)) { u.setTelefone(tel); usuarioRepository.save(u); }
        });

        String nome = usuarioRepository.findById(sessao.getUsuarioId()).map(u -> u.getNome().split(" ")[0]).orElse("usuário");
        String resp = "✅ *Vinculado, " + nome + "!*\n\n💰 \"Recebi 1500 do João\"\n💸 \"Gastei 200 na padaria\"\n📊 \"Meu saldo?\"\n📋 \"Pendentes?\"\n🎙️ Também aceito áudio!";
        enviarMensagem(sessao.getTelefone(), resp);
        salvarMensagem(sessao.getId(), "ENTRADA", "TEXTO", codigo, null);
        salvarMensagem(sessao.getId(), "SAIDA", "TEXTO", resp, null);
    }

    // ═══ PROCESSAR COM IA ════════════════════════════════════════════════════

    @Transactional
    public void processarMensagemVinculada(WhatsappSessao sessao, String texto, boolean isAudio) {
        long minutos = ChronoUnit.MINUTES.between(sessao.getUltimaMensagemEm(), LocalDateTime.now());
        if (minutos > TIMEOUT_MINUTOS) sessao.setContexto(null);

        long total = mensagemRepository.countBySessaoId(sessao.getId());
        if (total >= RATE_LIMIT_POR_HORA) {
            enviarMensagem(sessao.getTelefone(), "⏳ Limite atingido.");
            return;
        }

        salvarMensagem(sessao.getId(), "ENTRADA", isAudio ? "AUDIO" : "TEXTO", texto, isAudio ? texto : null);
        sessao.setUltimaMensagemEm(LocalDateTime.now());
        sessaoRepository.save(sessao);

        // ── Intercepta resposta "1", "2" ou "cancelar" da pergunta pendente ──
        if (sessao.getContexto() != null && sessao.getContexto().startsWith("PERGUNTA_")) {
            String respostaP = tratarRespostaPergunta(sessao, texto);
            if (respostaP != null) {
                enviarMensagem(sessao.getTelefone(), respostaP);
                salvarMensagem(sessao.getId(), "SAIDA", "TEXTO", respostaP, null);
                return;
            }
        }

        List<WhatsappMensagem> historico = mensagemRepository.findBySessaoIdOrderByCriadoEmAsc(sessao.getId());
        AcaoInterpretada acao = aiService.interpretar(sessao, texto, historico);
        log.info("[WhatsApp] IA: acao={}", acao.acao());

        String respostaFinal;

        switch (acao.acao()) {
            case "CONSULTAR_SALDO" -> respostaFinal = consultarSaldo(sessao);
            case "CONSULTAR_PENDENTES" -> {
                String tipo = acao.dados() != null ? acao.dados().path("tipo").asText("AMBOS") : "AMBOS";
                respostaFinal = consultarPendentes(sessao, tipo);
            }
            case "CRIAR_TITULO", "BAIXAR_TITULO", "BAIXAR_RECEBIMENTO", "CRIAR_RECEBIMENTO" -> {
                sessao.setContexto(acao.acao() + "|" + (acao.dados() != null ? acao.dados().toString() : "{}"));
                sessaoRepository.save(sessao);
                respostaFinal = montarConfirmacao(acao, sessao);
            }
            case "CRIAR_TITULO_PAGO" -> {
                // Verifica se tem título pendente do mesmo fornecedor (match no Java, não na IA)
                String fornNome = acao.dados() != null ? acao.dados().path("fornecedorNome").asText("") : "";
                respostaFinal = verificarPendenteTitulo(sessao, acao, fornNome);
            }
            case "CRIAR_RECEBIMENTO_PAGO" -> {
                // Verifica se tem recebimento pendente do mesmo cliente (match no Java)
                String cliNome = acao.dados() != null ? acao.dados().path("clienteNome").asText("") : "";
                respostaFinal = verificarPendenteRecebimento(sessao, acao, cliNome);
            }
            case "CONFIRMAR" -> {
                if (sessao.getContexto() != null) {
                    String ctx = sessao.getContexto();
                    if (acao.dados() != null && acao.dados().has("conta")) {
                        String contaNome = acao.dados().path("conta").asText("");
                        if (!contaNome.isBlank()) ctx = ctx + "|conta:" + contaNome;
                    }
                    sessao.setContexto(null);
                    sessaoRepository.save(sessao);
                    sessaoRepository.flush();
                    respostaFinal = executarAcaoReal(ctx, sessao.getUsuarioId(), sessao.getEmpresaId());
                    mensagemRepository.deleteBySessaoId(sessao.getId());
                } else {
                    respostaFinal = "Não há operação pendente.";
                }
            }
            case "CANCELAR" -> {
                sessao.setContexto(null); sessaoRepository.save(sessao);
                mensagemRepository.deleteBySessaoId(sessao.getId());
                respostaFinal = "❌ Cancelado.";
            }
            default -> respostaFinal = acao.resposta();
        }

        enviarMensagem(sessao.getTelefone(), respostaFinal);
        salvarMensagem(sessao.getId(), "SAIDA", "TEXTO", respostaFinal, null);
    }

    // ═══ VERIFICAÇÃO DE PENDENTES (match por Java, não pela IA) ══════════════

    private String verificarPendenteTitulo(WhatsappSessao sessao, AcaoInterpretada acao, String fornNome) {
        if (!fornNome.isBlank()) {
            Optional<Titulo> pendente = tituloRepository.findAll().stream()
                    .filter(t -> sessao.getUsuarioId().equals(t.getUsuario().getId()))
                    .filter(t -> "PENDENTE".equals(t.getStatus()) || "VENCIDO".equals(t.getStatus()))
                    .filter(t -> t.getFornecedorNome() != null &&
                            t.getFornecedorNome().toLowerCase().contains(fornNome.toLowerCase()))
                    .findFirst();

            if (pendente.isPresent()) {
                Titulo tp = pendente.get();
                sessao.setContexto("PERGUNTA_TITULO|" + (acao.dados() != null ? acao.dados().toString() : "{}") +
                        "|pendente:" + tp.getNumero());
                sessaoRepository.save(sessao);
                return String.format(
                        "📋 *Título pendente encontrado!*\n\n" +
                                "🏢 *%s*\n" +
                                "📄 %s — R$ %,.2f\n\n" +
                                "━━━━━━━━━━━━━━━━\n\n" +
                                "1️⃣ *Baixar* esse título pendente\n" +
                                "2️⃣ *Criar nova* despesa (já paga)\n" +
                                "❌ *Cancelar*\n\n" +
                                "Responda *1*, *2* ou *cancelar*",
                        tp.getFornecedorNome(), tp.getNumero(), tp.getSaldo());
            }
        }

        // Sem pendente — vai direto pra confirmação
        sessao.setContexto(acao.acao() + "|" + (acao.dados() != null ? acao.dados().toString() : "{}"));
        sessaoRepository.save(sessao);
        return montarConfirmacao(acao, sessao);
    }

    private String verificarPendenteRecebimento(WhatsappSessao sessao, AcaoInterpretada acao, String cliNome) {
        if (!cliNome.isBlank()) {
            Optional<Recebimento> pendente = recebimentoRepository
                    .findByEmpresaId(sessao.getEmpresaId(), org.springframework.data.domain.PageRequest.of(0, 100))
                    .stream()
                    .filter(r -> "PENDENTE".equals(r.getStatus()) || "ATRASADO".equals(r.getStatus()))
                    .filter(r -> r.getCliente() != null &&
                            r.getCliente().getNome().toLowerCase().contains(cliNome.toLowerCase()))
                    .findFirst();

            if (pendente.isPresent()) {
                Recebimento rp = pendente.get();
                sessao.setContexto("PERGUNTA_RECEBIMENTO|" + (acao.dados() != null ? acao.dados().toString() : "{}") +
                        "|pendente:" + rp.getNumero());
                sessaoRepository.save(sessao);
                return String.format(
                        "📋 *Recebimento pendente encontrado!*\n\n" +
                                "👤 *%s*\n" +
                                "📄 %s — R$ %,.2f\n\n" +
                                "━━━━━━━━━━━━━━━━\n\n" +
                                "1️⃣ *Baixar* esse recebimento pendente\n" +
                                "2️⃣ *Criar novo* recebimento (já recebido)\n" +
                                "❌ *Cancelar*\n\n" +
                                "Responda *1*, *2* ou *cancelar*",
                        rp.getCliente().getNome(), rp.getNumero(), rp.getSaldoPendente());
            }
        }

        sessao.setContexto(acao.acao() + "|" + (acao.dados() != null ? acao.dados().toString() : "{}"));
        sessaoRepository.save(sessao);
        return montarConfirmacao(acao, sessao);
    }

    // ═══ TRATAR RESPOSTA 1/2/CANCELAR ════════════════════════════════════════

    private String tratarRespostaPergunta(WhatsappSessao sessao, String texto) {
        String ctx = sessao.getContexto();
        String textoLimpo = texto.trim().toLowerCase();

        // Cancelar
        if (textoLimpo.matches("cancelar|cancela|não|nao|deixa|deixa pra lá")) {
            sessao.setContexto(null);
            sessaoRepository.save(sessao);
            mensagemRepository.deleteBySessaoId(sessao.getId());
            return "❌ Cancelado.";
        }

        String[] partes = ctx.split("\\|");
        String dadosJson = partes.length > 1 ? partes[1] : "{}";
        String numPendente = "";
        for (String p : partes) {
            if (p.startsWith("pendente:")) numPendente = p.substring(9);
        }

        boolean ehTitulo = ctx.startsWith("PERGUNTA_TITULO");

        // Opção 1 — Baixar pendente
        if (textoLimpo.matches("1|baixar|o pendente|esse|primeiro")) {
            String acaoBaixa = ehTitulo ? "BAIXAR_TITULO" : "BAIXAR_RECEBIMENTO";
            String campoNum = ehTitulo ? "tituloNumero" : "recebimentoNumero";

            // Injeta o número do pendente nos dados
            try {
                JsonNode dadosOriginal = objectMapper.readTree(dadosJson);
                var dadosMut = objectMapper.createObjectNode();
                dadosOriginal.fields().forEachRemaining(e -> dadosMut.set(e.getKey(), e.getValue()));
                dadosMut.put(campoNum, numPendente);
                String novoJson = objectMapper.writeValueAsString(dadosMut);

                sessao.setContexto(acaoBaixa + "|" + novoJson);
                sessaoRepository.save(sessao);

                // Monta confirmação de baixa
                StringBuilder sb = new StringBuilder();
                sb.append(ehTitulo ? "💸" : "💰");
                sb.append(String.format(" *Baixar %s %s*\n", ehTitulo ? "título" : "recebimento", numPendente));

                List<SaldoBancario> contas = saldoRepository.findByEmpresaIdAndAtivoTrue(sessao.getEmpresaId());
                if (contas.size() > 1) {
                    sb.append("\n🏦 Contas: ");
                    sb.append(contas.stream().map(SaldoBancario::getNomeConta).collect(Collectors.joining(", ")));
                    sb.append("\n_\"sim, [conta]\" pra escolher ou \"sim\" pra conta principal_\n");
                }
                sb.append("\n✅ *Confirma?* (sim/não)");
                return sb.toString();
            } catch (Exception e) {
                log.error("[WhatsApp] Erro ao montar baixa pendente: {}", e.getMessage());
                return "❌ Erro ao processar. Tente novamente.";
            }
        }

        // Opção 2 — Criar novo
        if (textoLimpo.matches("2|criar|nova|novo|outra|segundo|segunda")) {
            String acaoCriar = ehTitulo ? "CRIAR_TITULO_PAGO" : "CRIAR_RECEBIMENTO_PAGO";
            sessao.setContexto(acaoCriar + "|" + dadosJson);
            sessaoRepository.save(sessao);

            try {
                JsonNode dados = objectMapper.readTree(dadosJson);
                AcaoInterpretada acaoFake = new AcaoInterpretada(acaoCriar, dados, "");
                return montarConfirmacao(acaoFake, sessao);
            } catch (Exception e) {
                return "❌ Erro ao processar. Tente novamente.";
            }
        }

        // Não entendeu — retorna null pra seguir pro fluxo normal da IA
        return null;
    }

    // ═══ CONFIRMAÇÃO ═════════════════════════════════════════════════════════

    private String montarConfirmacao(AcaoInterpretada acao, WhatsappSessao sessao) {
        StringBuilder sb = new StringBuilder();
        String a = acao.acao();
        JsonNode d = acao.dados();

        switch (a) {
            case "CRIAR_TITULO", "CRIAR_TITULO_PAGO" -> {
                String forn = d != null ? d.path("fornecedorNome").asText("?") : "?";
                String val = d != null ? d.path("valor").asText("0") : "0";
                String pago = a.contains("PAGO") ? " _(já pago)_" : "";
                sb.append(String.format("💸 *Lançar despesa%s:*\n\n🏢 %s\n💰 R$ %s\n", pago, forn, val));
            }
            case "CRIAR_RECEBIMENTO", "CRIAR_RECEBIMENTO_PAGO" -> {
                String cli = d != null ? d.path("clienteNome").asText("?") : "?";
                String val = d != null ? d.path("valor").asText("0") : "0";
                String pago = a.contains("PAGO") ? " _(já recebido)_" : "";
                sb.append(String.format("💰 *Lançar recebimento%s:*\n\n👤 %s\n💰 R$ %s\n", pago, cli, val));
            }
            case "BAIXAR_TITULO" -> {
                String num = d != null ? d.path("tituloNumero").asText("?") : "?";
                String forn = d != null ? d.path("fornecedorNome").asText("") : "";
                sb.append(String.format("💸 *Baixar título %s*%s\n", num, forn.isBlank() ? "" : " — " + forn));
            }
            case "BAIXAR_RECEBIMENTO" -> {
                String num = d != null ? d.path("recebimentoNumero").asText("?") : "?";
                String cli = d != null ? d.path("clienteNome").asText("") : "";
                sb.append(String.format("💰 *Baixar recebimento %s*%s\n", num, cli.isBlank() ? "" : " — " + cli));
            }
        }

        if (d != null && d.has("categoriaId") && !d.path("categoriaId").isNull()
                && !d.path("categoriaId").asText("").isBlank() && !"null".equals(d.path("categoriaId").asText())) {
            sb.append("🏷️ Categoria sugerida pela IA\n");
        }

        List<SaldoBancario> contas = saldoRepository.findByEmpresaIdAndAtivoTrue(sessao.getEmpresaId());
        if (contas.size() > 1) {
            sb.append("\n🏦 Contas: ");
            sb.append(contas.stream().map(SaldoBancario::getNomeConta).collect(Collectors.joining(", ")));
            sb.append("\n_\"sim, [conta]\" pra escolher ou \"sim\" pra conta principal_\n");
        }

        sb.append("\n✅ *Confirma?* (sim/não)");
        return sb.toString();
    }

    // ═══ EXECUTAR AÇÃO ═══════════════════════════════════════════════════════

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String executarAcaoReal(String contexto, UUID usuarioId, UUID empresaId) {
        String[] partes = contexto.split("\\|");
        String acao = partes[0];
        String dadosJson = partes.length > 1 ? partes[1] : "{}";
        String contaNome = null;
        for (int i = 2; i < partes.length; i++) {
            if (partes[i].startsWith("conta:")) contaNome = partes[i].substring(6);
        }

        try {
            JsonNode dados = objectMapper.readTree(dadosJson);
            Usuario usuario = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            UUID contaId = null;
            if (contaNome != null) {
                String cn = contaNome;
                contaId = saldoRepository.findByEmpresaIdAndAtivoTrue(empresaId).stream()
                        .filter(c -> c.getNomeConta().toLowerCase().contains(cn.toLowerCase()))
                        .map(SaldoBancario::getId).findFirst().orElse(null);
            }

            return switch (acao) {
                case "CRIAR_TITULO" -> executarCriarTitulo(usuario, dados, false, contaId);
                case "CRIAR_TITULO_PAGO" -> executarCriarTitulo(usuario, dados, true, contaId);
                case "CRIAR_RECEBIMENTO" -> executarCriarRecebimento(usuario, dados, false, contaId);
                case "CRIAR_RECEBIMENTO_PAGO" -> executarCriarRecebimento(usuario, dados, true, contaId);
                case "BAIXAR_TITULO" -> executarBaixarTitulo(usuario, dados, contaId);
                case "BAIXAR_RECEBIMENTO" -> executarBaixarRecebimento(usuario, dados, contaId);
                default -> "Ação não reconhecida.";
            };
        } catch (Exception e) {
            log.error("[WhatsApp] Erro {}: {}", acao, e.getMessage(), e);
            return "⚠️ Não consegui processar essa operação. Tente fazer direto em *whallet.com.br*";
        }
    }

    // ═══ AÇÕES ═══════════════════════════════════════════════════════════════

    private String executarCriarTitulo(Usuario usuario, JsonNode dados, boolean jaPago, UUID contaId) {
        String fornecedor = dados.path("fornecedorNome").asText("Fornecedor");
        String descricao = dados.path("descricao").asText("");
        BigDecimal valor = new BigDecimal(dados.path("valor").asText("0"));
        String catIdStr = dados.path("categoriaId").asText("");
        UUID categoriaId = null;
        if (!catIdStr.isBlank() && !"null".equals(catIdStr)) {
            try { categoriaId = UUID.fromString(catIdStr); } catch (Exception ignored) {}
        }

        Titulo titulo = Titulo.builder()
                .fornecedorNome(fornecedor).emissao(LocalDate.now()).vencimento(LocalDate.now())
                .valor(valor).saldo(valor).categoriaId(categoriaId)
                .origem("WHATSAPP")
                .observacao(descricao.isBlank() ? "Despesa" : descricao)
                .build();

        Titulo criado = tituloService.criar(titulo, usuario);

        if (jaPago) {
            tituloService.registrarBaixa(criado.getId(), valor, LocalDate.now(),
                    "Baixa automática via WhatsApp", contaId, usuario);
            return String.format("✅ *Despesa registrada e paga!*\n\n🏢 %s\n💸 R$ %,.2f\n📊 Status: PAGO\n🏷️ _Via WhatsApp_",
                    fornecedor, valor);
        }

        return String.format("✅ *Título criado (pendente):*\n\n🏢 %s\n💸 R$ %,.2f\n📅 Venc: %s\n🏷️ _Via WhatsApp_",
                fornecedor, valor, criado.getVencimento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
    }

    private String executarCriarRecebimento(Usuario usuario, JsonNode dados, boolean jaRecebido, UUID contaId) {
        String clienteNome = dados.path("clienteNome").asText("");
        String clienteIdStr = dados.path("clienteId").asText("");
        String descricao = dados.path("descricao").asText("");
        if (descricao.isBlank()) descricao = "Recebimento via WhatsApp";
        BigDecimal valor = new BigDecimal(dados.path("valor").asText("0"));
        String catIdStr = dados.path("categoriaId").asText("");
        UUID categoriaId = null;
        if (!catIdStr.isBlank() && !"null".equals(catIdStr)) {
            try { categoriaId = UUID.fromString(catIdStr); } catch (Exception ignored) {}
        }

        UUID clienteId = null;
        if (!clienteIdStr.isBlank() && !"null".equals(clienteIdStr)) {
            try { clienteId = UUID.fromString(clienteIdStr); } catch (Exception ignored) {}
        }
        if (clienteId == null && !clienteNome.isBlank()) {
            List<Cliente> clientes = clienteRepository.buscarPorNome(usuario.getEmpresa().getId(), clienteNome);
            if (!clientes.isEmpty()) clienteId = clientes.get(0).getId();
            else return "❌ Cliente \"" + clienteNome + "\" não encontrado. Cadastre-o primeiro.";
        }
        if (clienteId == null) return "❌ Não consegui identificar o cliente.";

        RecebimentoRequest request = new RecebimentoRequest(
                clienteId, descricao, null, categoriaId, null, LocalDate.now(), valor,
                "PIX", null, null, null, null, "Via WhatsApp"
        );
        RecebimentoResponse criado = recebimentoService.criar(usuario, request);

        if (jaRecebido) {
            recebimentoService.receber(usuario, criado.id(),
                    new ReceberRequest(null, LocalDate.now(), contaId));
            return String.format("✅ *Recebimento registrado e baixado!*\n\n👤 %s\n💰 R$ %,.2f\n📊 Status: RECEBIDO\n🏷️ _Via WhatsApp_",
                    criado.cliente().nome(), valor);
        }

        return String.format("✅ *Recebimento criado (pendente):*\n\n👤 %s\n💰 R$ %,.2f\n📅 Venc: %s\n🏷️ _Via WhatsApp_",
                criado.cliente().nome(), valor, criado.dataVencimento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
    }

    private String executarBaixarTitulo(Usuario usuario, JsonNode dados, UUID contaId) {
        String tituloNumero = dados.path("tituloNumero").asText("");
        String fornecedorNome = dados.path("fornecedorNome").asText("");

        List<Titulo> titulos = tituloRepository.findAll().stream()
                .filter(t -> usuario.getId().equals(t.getUsuario().getId()))
                .filter(t -> "PENDENTE".equals(t.getStatus()) || "VENCIDO".equals(t.getStatus()))
                .filter(t -> {
                    if (!tituloNumero.isBlank() && t.getNumero() != null && t.getNumero().equalsIgnoreCase(tituloNumero)) return true;
                    if (!fornecedorNome.isBlank() && t.getFornecedorNome() != null &&
                            t.getFornecedorNome().toLowerCase().contains(fornecedorNome.toLowerCase())) return true;
                    return false;
                }).toList();

        if (titulos.isEmpty()) return "❌ Título pendente não encontrado.";

        Titulo titulo = titulos.get(0);
        BigDecimal valorPago = BigDecimal.ZERO;
        String valorStr = dados.path("valor").asText("");
        if (!valorStr.isBlank() && !"null".equals(valorStr)) {
            try { valorPago = new BigDecimal(valorStr); } catch (Exception ignored) {}
        }
        if (valorPago.compareTo(BigDecimal.ZERO) <= 0) valorPago = titulo.getSaldo();

        Titulo baixado = tituloService.registrarBaixa(titulo.getId(), valorPago, LocalDate.now(),
                "Baixa via WhatsApp", contaId, usuario);

        return String.format("✅ *Título baixado!*\n\n📄 %s\n🏢 %s\n💸 R$ %,.2f\n📊 Status: %s",
                baixado.getNumero(), baixado.getFornecedorNome(), valorPago, baixado.getStatus());
    }

    private String executarBaixarRecebimento(Usuario usuario, JsonNode dados, UUID contaId) {
        String recebNumero = dados.path("recebimentoNumero").asText("");
        String clienteNome = dados.path("clienteNome").asText("");

        List<Recebimento> recebimentos = recebimentoRepository
                .findByEmpresaId(usuario.getEmpresa().getId(), org.springframework.data.domain.PageRequest.of(0, 100))
                .stream()
                .filter(r -> "PENDENTE".equals(r.getStatus()) || "ATRASADO".equals(r.getStatus()))
                .filter(r -> {
                    if (!recebNumero.isBlank() && r.getNumero() != null && r.getNumero().equalsIgnoreCase(recebNumero)) return true;
                    if (!clienteNome.isBlank() && r.getCliente() != null &&
                            r.getCliente().getNome().toLowerCase().contains(clienteNome.toLowerCase())) return true;
                    return false;
                }).toList();

        if (recebimentos.isEmpty()) return "❌ Recebimento pendente não encontrado.";

        Recebimento receb = recebimentos.get(0);
        BigDecimal valor = BigDecimal.ZERO;
        String valorStr = dados.path("valor").asText("");
        if (!valorStr.isBlank() && !"null".equals(valorStr)) {
            try { valor = new BigDecimal(valorStr); } catch (Exception ignored) {}
        }

        RecebimentoResponse baixado = recebimentoService.receber(usuario, receb.getId(),
                new ReceberRequest(valor.compareTo(BigDecimal.ZERO) > 0 ? valor : null, LocalDate.now(), contaId));

        return String.format("✅ *Recebimento baixado!*\n\n📄 %s\n👤 %s\n💰 R$ %,.2f\n📊 Status: %s",
                baixado.numero(), baixado.cliente().nome(), baixado.valorRecebido(), baixado.status());
    }

    // ═══ CONSULTAS ═══════════════════════════════════════════════════════════

    private String consultarSaldo(WhatsappSessao sessao) {
        List<SaldoBancario> contas = saldoRepository.findByEmpresaIdAndAtivoTrue(sessao.getEmpresaId());
        if (contas.isEmpty()) return "🏦 Nenhuma conta cadastrada.";
        StringBuilder sb = new StringBuilder("🏦 *Suas contas:*\n\n");
        BigDecimal totalGeral = BigDecimal.ZERO;
        for (SaldoBancario c : contas) {
            BigDecimal si = c.getSaldoInicial() != null ? c.getSaldoInicial() : BigDecimal.ZERO;
            BigDecimal mov = saldoRepository.somarMovimentosDaConta(c.getId());
            BigDecimal sa = si.add(mov != null ? mov : BigDecimal.ZERO);
            totalGeral = totalGeral.add(sa);
            sb.append(String.format("• *%s* (%s)\n  R$ %,.2f\n\n", c.getNomeConta(), c.getBanco(), sa));
        }
        sb.append(String.format("💰 *Total: R$ %,.2f*", totalGeral));
        return sb.toString().trim();
    }

    private String consultarPendentes(WhatsappSessao sessao, String tipo) {
        StringBuilder sb = new StringBuilder();
        if ("TITULO".equals(tipo) || "AMBOS".equals(tipo)) {
            List<Titulo> t = tituloRepository.findAll().stream()
                    .filter(x -> sessao.getUsuarioId().equals(x.getUsuario().getId()))
                    .filter(x -> "PENDENTE".equals(x.getStatus()) || "VENCIDO".equals(x.getStatus()))
                    .sorted(Comparator.comparing(Titulo::getVencimento)).limit(10).toList();
            if (!t.isEmpty()) { sb.append("💸 *Títulos:*\n\n"); for (Titulo x : t)
                sb.append(String.format("• *%s* — %s\n  R$ %,.2f | %s %s\n\n", x.getNumero(), x.getFornecedorNome(), x.getSaldo(),
                        x.getVencimento().format(DateTimeFormatter.ofPattern("dd/MM")), "VENCIDO".equals(x.getStatus()) ? "⚠️" : "🟡"));
            } else sb.append("💸 Nenhum título pendente! 🎉\n\n");
        }
        if ("RECEBIMENTO".equals(tipo) || "AMBOS".equals(tipo)) {
            List<Recebimento> r = recebimentoRepository.findByEmpresaId(sessao.getEmpresaId(),
                            org.springframework.data.domain.PageRequest.of(0, 100)).stream()
                    .filter(x -> "PENDENTE".equals(x.getStatus()) || "ATRASADO".equals(x.getStatus())).limit(10).toList();
            if (!r.isEmpty()) { sb.append("💰 *Recebimentos:*\n\n"); for (Recebimento x : r)
                sb.append(String.format("• *%s* — %s\n  R$ %,.2f | %s %s\n\n", x.getNumero(),
                        x.getCliente() != null ? x.getCliente().getNome() : "—", x.getSaldoPendente(),
                        x.getDataVencimento().format(DateTimeFormatter.ofPattern("dd/MM")), "ATRASADO".equals(x.getStatus()) ? "🔴" : "🟡"));
            } else sb.append("💰 Nenhum recebimento pendente! 🎉\n\n");
        }
        return sb.toString().trim();
    }

    // ═══ STATUS ══════════════════════════════════════════════════════════════

    public Map<String, Object> verificarStatus(Usuario usuario) {
        Optional<WhatsappSessao> s = sessaoRepository.findAll().stream()
                .filter(x -> usuario.getId().equals(x.getUsuarioId()) && Boolean.TRUE.equals(x.getAtiva()) && Boolean.TRUE.equals(x.getVerificada())).findFirst();
        if (s.isPresent()) return Map.of("vinculado", true, "telefone", s.get().getTelefone());
        Optional<WhatsappSessao> p = sessaoRepository.findAll().stream()
                .filter(x -> usuario.getId().equals(x.getUsuarioId()) && Boolean.TRUE.equals(x.getAtiva()) && !Boolean.TRUE.equals(x.getVerificada())).findFirst();
        if (p.isPresent()) return Map.of("vinculado", false, "pendente", true, "telefone", p.get().getTelefone());
        return Map.of("vinculado", false, "pendente", false);
    }

    // ═══ HELPERS ═════════════════════════════════════════════════════════════

    @SuppressWarnings("unchecked")
    private String extrairTexto(Map<String, Object> msg) {
        if (msg == null) return null;
        if (msg.containsKey("conversation")) return (String) msg.get("conversation");
        if (msg.containsKey("extendedTextMessage")) return (String) ((Map<String, Object>) msg.get("extendedTextMessage")).get("text");
        return null;
    }

    private void salvarMensagem(UUID sessaoId, String dir, String tipo, String conteudo, String transcricao) {
        mensagemRepository.save(WhatsappMensagem.builder()
                .sessaoId(sessaoId).direcao(dir).tipo(tipo).conteudo(conteudo).transcricao(transcricao).build());
    }

    public void enviarMensagem(String numero, String texto) {
        try {
            HttpHeaders h = new HttpHeaders(); h.setContentType(MediaType.APPLICATION_JSON); h.set("apikey", evolutionApiKey);
            log.info("[WhatsApp] Enviando para {} | url={} | instance={} | keyLen={}",
                    numero, evolutionUrl, evolutionInstance,
                    evolutionApiKey != null ? evolutionApiKey.length() : 0);
            var resp = restTemplate.postForEntity(evolutionUrl + "/message/sendText/" + evolutionInstance,
                    new HttpEntity<>(Map.of("number", numero, "textMessage", Map.of("text", texto)), h), String.class);
            log.info("[WhatsApp] Enviado para {} | status={} | body={}",
                    numero, resp.getStatusCode(),
                    resp.getBody() != null ? resp.getBody().substring(0, Math.min(120, resp.getBody().length())) : "null");
        } catch (Exception e) { log.error("[WhatsApp] Erro envio para {}: {}", numero, e.getMessage()); }
    }

    @Transactional
    public void verificarCodigo(Usuario usuario, String codigo) {
        if (codigo == null || codigo.isBlank()) throw new IllegalArgumentException("Código obrigatório.");
        String codigoLimpo = codigo.trim().replaceAll("\\s", "");

        WhatsappSessao sessao = sessaoRepository.findAll().stream()
                .filter(s -> usuario.getId().equals(s.getUsuarioId()))
                .filter(s -> Boolean.TRUE.equals(s.getAtiva()) && !Boolean.TRUE.equals(s.getVerificada()))
                .filter(s -> codigoLimpo.equals(s.getCodigoVerificacao()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Código inválido ou expirado."));

        if (sessao.getCodigoExpiraEm() != null && LocalDateTime.now().isAfter(sessao.getCodigoExpiraEm())) {
            sessao.setAtiva(false); sessaoRepository.save(sessao);
            throw new IllegalArgumentException("Código expirado. Solicite um novo.");
        }

        sessao.setVerificada(true);
        sessao.setCodigoVerificacao(null);
        sessao.setUltimaMensagemEm(LocalDateTime.now());
        sessaoRepository.save(sessao);

        String nome = usuario.getNome().split(" ")[0];
        enviarMensagem(sessao.getTelefone(),
                "✅ *Vinculado, " + nome + "!*\n\n💰 \"Recebi 1500 do João\"\n💸 \"Gastei 200 na padaria\"\n📊 \"Meu saldo?\"\n📋 \"Pendentes?\"\n🎙️ Também aceito áudio!");
    }

    @Transactional
    public void desvincular(Usuario usuario) {
        sessaoRepository.findAll().stream()
                .filter(s -> usuario.getId().equals(s.getUsuarioId()) && Boolean.TRUE.equals(s.getAtiva()))
                .forEach(s -> {
                    s.setAtiva(false);
                    sessaoRepository.save(s);
                });
        log.info("[WhatsApp] Desvinculado: usuário {}", usuario.getNome());
    }
}