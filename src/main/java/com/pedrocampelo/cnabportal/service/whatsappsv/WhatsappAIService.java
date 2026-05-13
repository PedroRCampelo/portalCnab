package com.pedrocampelo.cnabportal.service.whatsappsv;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pedrocampelo.cnabportal.model.*;
import com.pedrocampelo.cnabportal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsappAIService {

    private final ObjectMapper objectMapper;
    private final TituloRepository tituloRepository;
    private final RecebimentoRepository recebimentoRepository;
    private final SaldoBancarioRepository saldoRepository;
    private final ClienteRepository clienteRepository;
    private final CategoriaRepository categoriaRepository;

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.chat.model:gpt-4o}")
    private String chatModel;

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .build();

    public AcaoInterpretada interpretar(WhatsappSessao sessao, String mensagem,
                                        List<WhatsappMensagem> historico) {
        try {
            String contexto = montarContexto(sessao, historico);
            String prompt = montarPrompt(contexto);
            String resposta = chamarGPT(prompt, mensagem);
            return parseResposta(resposta);
        } catch (Exception e) {
            log.error("[WhatsApp IA] Erro: {}", e.getMessage(), e);
            return new AcaoInterpretada("CONVERSA", null,
                    "Desculpe, tive um problema. Pode tentar de novo?");
        }
    }

    private String montarContexto(WhatsappSessao sessao, List<WhatsappMensagem> historico) {
        StringBuilder ctx = new StringBuilder();

        List<Titulo> titulosPendentes = tituloRepository.findAll().stream()
                .filter(t -> sessao.getUsuarioId().equals(t.getUsuario().getId()))
                .filter(t -> "PENDENTE".equals(t.getStatus()) || "VENCIDO".equals(t.getStatus()))
                .sorted(Comparator.comparing(Titulo::getVencimento))
                .limit(10).toList();

        if (!titulosPendentes.isEmpty()) {
            ctx.append("TÍTULOS A PAGAR PENDENTES:\n");
            for (Titulo t : titulosPendentes)
                ctx.append(String.format("- %s | %s | R$ %.2f | Venc: %s | %s\n",
                        t.getNumero(), t.getFornecedorNome(), t.getSaldo(),
                        t.getVencimento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), t.getStatus()));
            ctx.append("\n");
        }

        List<Recebimento> recebPendentes = recebimentoRepository
                .findByEmpresaId(sessao.getEmpresaId(), org.springframework.data.domain.PageRequest.of(0, 10))
                .stream()
                .filter(r -> "PENDENTE".equals(r.getStatus()) || "ATRASADO".equals(r.getStatus()))
                .toList();

        if (!recebPendentes.isEmpty()) {
            ctx.append("RECEBIMENTOS PENDENTES:\n");
            for (Recebimento r : recebPendentes)
                ctx.append(String.format("- %s | %s | R$ %.2f | Venc: %s | %s\n",
                        r.getNumero(), r.getCliente() != null ? r.getCliente().getNome() : "—",
                        r.getSaldoPendente(),
                        r.getDataVencimento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), r.getStatus()));
            ctx.append("\n");
        }

        List<SaldoBancario> contas = saldoRepository.findByEmpresaIdAndAtivoTrue(sessao.getEmpresaId());
        if (!contas.isEmpty()) {
            ctx.append("CONTAS BANCÁRIAS:\n");
            for (SaldoBancario c : contas) {
                BigDecimal si = c.getSaldoInicial() != null ? c.getSaldoInicial() : BigDecimal.ZERO;
                BigDecimal mov = saldoRepository.somarMovimentosDaConta(c.getId());
                BigDecimal saldo = si.add(mov != null ? mov : BigDecimal.ZERO);
                ctx.append(String.format("- %s (%s) | Saldo: R$ %.2f\n", c.getNomeConta(), c.getBanco(), saldo));
            }
            ctx.append("\n");
        }

        List<Categoria> catDespesa = categoriaRepository.findByEmpresaIdAndTipoOrderByNome(sessao.getEmpresaId(), "DESPESA");
        if (!catDespesa.isEmpty()) {
            ctx.append("CATEGORIAS DE DESPESA: ");
            ctx.append(String.join(", ", catDespesa.stream().map(c -> c.getNome() + " (ID:" + c.getId() + ")").toList()));
            ctx.append("\n\n");
        }

        List<Categoria> catReceita = categoriaRepository.findByEmpresaIdAndTipoOrderByNome(sessao.getEmpresaId(), "RECEITA");
        if (!catReceita.isEmpty()) {
            ctx.append("CATEGORIAS DE RECEITA: ");
            ctx.append(String.join(", ", catReceita.stream().map(c -> c.getNome() + " (ID:" + c.getId() + ")").toList()));
            ctx.append("\n\n");
        }

        List<Cliente> clientes = clienteRepository.findByEmpresaIdAndAtivoTrueOrderByNomeAsc(sessao.getEmpresaId())
                .stream().limit(15).toList();
        if (!clientes.isEmpty()) {
            ctx.append("CLIENTES CADASTRADOS:\n");
            for (Cliente c : clientes)
                ctx.append(String.format("- %s (ID: %s)\n", c.getNome(), c.getId()));
            ctx.append("\n");
        }

        if (historico != null && !historico.isEmpty()) {
            List<WhatsappMensagem> recentes = historico.stream()
                    .skip(Math.max(0, historico.size() - 6)).toList();
            ctx.append("HISTÓRICO DA CONVERSA:\n");
            for (WhatsappMensagem m : recentes)
                ctx.append("ENTRADA".equals(m.getDirecao()) ? "Usuário: " : "Bot: ")
                        .append(m.getConteudo()).append("\n");
        }

        return ctx.toString();
    }

    private String montarPrompt(String contexto) {
        return """
            Você é o assistente financeiro da Whallet via WhatsApp.
            Responda SEMPRE e SOMENTE com JSON válido: { "acao": "...", "dados": {...}, "resposta": "..." }
            Sem markdown, sem texto fora do JSON.
            
            Data de hoje: %s
            
            CONTEXTO:
            %s
            
            ═══ FORMATO ═══
            - "acao": string (uma das ações listadas abaixo)
            - "dados": object ou null
            - "resposta": string (mensagem pro usuário, concisa, com emojis moderados)
            - Valores monetários em "dados" são números puros (1500, não "R$ 1.500")
            - NUNCA invente nomes. Use exatamente o que o usuário disse.
            
            ═══ CONFIRMAÇÃO / CANCELAMENTO ═══
            Quando o usuário diz "sim", "confirma", "ok", "pode", "isso":
              → acao="CONFIRMAR", dados=null (ou {"conta":"NomeConta"} se mencionou conta)
            Quando diz "não", "cancela", "deixa":
              → acao="CANCELAR", dados=null
            NUNCA pergunte de novo após o usuário confirmar.
            
                ═══ DECISÃO PRINCIPAL ═══
                           \s
                            Siga este fluxo NA ORDEM:
                           \s
                            PASSO 1 — É uma consulta?
                              "Meu saldo", "Quanto tenho" → CONSULTAR_SALDO
                              "O que tá pendente", "Quais contas" → CONSULTAR_PENDENTES { tipo: "AMBOS" }
                           \s
                            PASSO 2 — É uma referência EXPLÍCITA a título/recebimento existente?
                              Contém "o título", "a conta da", "o AP", "baixa o", "o recebimento", "o RC":
                              → BAIXAR_TITULO ou BAIXAR_RECEBIMENTO (sem perguntar)
                           \s
                            PASSO 3 — DIFERENCIAR "PAGUEI":
                              "Paguei X pra/para Y" = DESPESA
                              "Paguei X da Y" = DESPESA
                              "Recebi X da Y" = RECEBIMENTO
                              "Y me pagou X" = RECEBIMENTO
                              A palavra "paguei" SEMPRE indica DESPESA, nunca recebimento.
                           \s
                            PASSO 4 — É uma despesa? ("gastei", "comprei", "paguei", "torrei")
                              → SEMPRE retorne CRIAR_TITULO_PAGO. NÃO verifique pendentes. NÃO pergunte. O sistema faz isso.
                           \s
                            PASSO 5 — É um recebimento? ("recebi", "ganhei", "entrou", "caiu", "me pagaram")
                              → SEMPRE retorne CRIAR_RECEBIMENTO_PAGO. NÃO verifique pendentes. NÃO pergunte. O sistema faz isso.
                           \s
                            PASSO 6 — É lançamento futuro? ("lançar título", "criar recebimento", "vence dia X")
                              → CRIAR_TITULO ou CRIAR_RECEBIMENTO (pendente, sem baixa)
                           \s
                            PASSO 7 — Qualquer outra coisa → CONVERSA
                           \s
                            ═══ CATEGORIAS ═══
                            
            Baseado no fornecedor/cliente, sugira a categoria mais adequada da lista.
            Se não souber, deixe categoriaId como null.
            
            ═══ AÇÕES ═══
            CRIAR_TITULO:           { fornecedorNome, descricao, valor, dataVencimento, categoriaId }
            CRIAR_TITULO_PAGO:      { fornecedorNome, descricao, valor, categoriaId }
            CRIAR_RECEBIMENTO:      { clienteId, clienteNome, descricao, valor, dataVencimento, categoriaId }
            CRIAR_RECEBIMENTO_PAGO: { clienteId, clienteNome, descricao, valor, categoriaId }
            BAIXAR_TITULO:          { tituloNumero, fornecedorNome, valor }
            BAIXAR_RECEBIMENTO:     { recebimentoNumero, clienteNome, valor }
            CONSULTAR_SALDO:        null
            CONSULTAR_PENDENTES:    { tipo: "TITULO" | "RECEBIMENTO" | "AMBOS" }
            CONFIRMAR:              null ou { "conta": "nome" }
            CANCELAR:               null
            CONVERSA:               null
            """.formatted(
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                contexto
        );
    }

    private String chamarGPT(String systemPrompt, String userMessage) {
        Map<String, Object> body = Map.of(
                "model", chatModel,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ),
                "temperature", 0.1,
                "max_tokens", 500
        );

        String response = restClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao parsear resposta GPT", e);
        }
    }

    private AcaoInterpretada parseResposta(String json) {
        try {
            String limpo = json.trim();
            if (limpo.startsWith("```")) limpo = limpo.replaceAll("```json\\s*", "").replaceAll("```\\s*", "");

            JsonNode root = objectMapper.readTree(limpo);
            String acao = root.path("acao").asText("CONVERSA");
            String resposta = root.path("resposta").asText("Não entendi.");
            JsonNode dados = root.has("dados") && !root.get("dados").isNull() ? root.get("dados") : null;

            return new AcaoInterpretada(acao, dados, resposta);
        } catch (Exception e) {
            log.warn("[WhatsApp IA] Erro parse: {}", e.getMessage());
            return new AcaoInterpretada("CONVERSA", null, json);
        }
    }

    public record AcaoInterpretada(String acao, JsonNode dados, String resposta) {}
}