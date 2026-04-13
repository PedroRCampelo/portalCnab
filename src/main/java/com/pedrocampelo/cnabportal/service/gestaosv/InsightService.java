package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.TituloRepository;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsightService {

    private final TituloRepository  tituloRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${openai.api-key:}")
    private String openAiKey;

    private static final int MIN_TITULOS     = 3;
    private static final int MAX_VENC_PROX   = 3;
    private static final int MAX_CATEGORIAS  = 3;
    private static final int DIAS_PROX_VENC  = 10;

    // ── Ponto de entrada ──────────────────────────────────────────────────────

    public Map<String, Object> gerarOuRecuperarInsight(Usuario usuario, String bot) {
        tituloRepository.atualizarVencidos();

        String botKey  = normalizarBot(bot);
        LocalDate hoje = LocalDate.now();

        // Verifica cache deste bot especificamente
        String   textoCache  = getTextoCache(usuario, botKey);
        LocalDate dataCache  = getDataCache(usuario, botKey);

        if (textoCache != null && hoje.equals(dataCache)) {
            log.debug("Cache hit ({}) para: {}", botKey, usuario.getEmail());
            return resposta(textoCache, false, botKey);
        }

        // Monta resumo financeiro
        ResumoFinanceiro resumo = montarResumo(usuario.getId(), hoje);

        // Dados insuficientes
        if (resumo.quantidadeLancamentos() < MIN_TITULOS) {
            return resposta(semDadosMensagem(botKey), false, botKey);
        }

        // API key não configurada
        if (openAiKey == null || openAiKey.isBlank()) {
            log.warn("OPENAI_API_KEY não configurada");
            return resposta(gerarInsightFallback(resumo), false, botKey);
        }

        // Chama a IA
        String insight = chamarOpenAi(resumo, botKey);

        // Persiste no cache deste bot
        Usuario fresh = usuarioRepository.findById(usuario.getId()).orElse(usuario);
        setCache(fresh, botKey, insight, hoje);
        // Incrementa versão global
        fresh.setInsightVersao((fresh.getInsightVersao() != null ? fresh.getInsightVersao() : 0) + 1);
        usuarioRepository.save(fresh);

        log.info("Insight gerado ({}) para: {}", botKey, usuario.getEmail());
        return resposta(insight, true, botKey);
    }

    // ── Helpers de cache por bot ──────────────────────────────────────────────

    private String getTextoCache(Usuario u, String bot) {
        return switch (bot) {
            case "frank" -> u.getInsightFrankTexto();
            case "anne"  -> u.getInsightAnneTexto();
            default      -> u.getInsightAuroraTexto();
        };
    }

    private LocalDate getDataCache(Usuario u, String bot) {
        return switch (bot) {
            case "frank" -> u.getInsightFrankGeradoEm();
            case "anne"  -> u.getInsightAnneGeradoEm();
            default      -> u.getInsightAuroraGeradoEm();
        };
    }

    private void setCache(Usuario u, String bot, String texto, LocalDate data) {
        switch (bot) {
            case "frank" -> { u.setInsightFrankTexto(texto); u.setInsightFrankGeradoEm(data); }
            case "anne"  -> { u.setInsightAnneTexto(texto);  u.setInsightAnneGeradoEm(data);  }
            default      -> { u.setInsightAuroraTexto(texto); u.setInsightAuroraGeradoEm(data); }
        }
    }

    private String normalizarBot(String bot) {
        if (bot == null) return "aurora";
        return switch (bot.toLowerCase().trim()) {
            case "frank" -> "frank";
            case "anne"  -> "anne";
            default      -> "aurora";
        };
    }

    private String semDadosMensagem(String bot) {
        return switch (bot) {
            case "frank" -> "Dados insuficientes para análise. Registre pelo menos " +
                    MIN_TITULOS + " títulos para que eu possa avaliar sua situação financeira.";
            case "anne"  -> "Para gerar insights analíticos são necessários pelo menos " +
                    MIN_TITULOS + " registros financeiros. Comece a lançar seus títulos.";
            default      -> "Oi! Ainda não tenho dados suficientes pra te ajudar 😅 " +
                    "Cadastra pelo menos " + MIN_TITULOS + " títulos e eu entro em ação!";
        };
    }

    // ── Monta o resumo estruturado ────────────────────────────────────────────

    private ResumoFinanceiro montarResumo(UUID usuarioId, LocalDate hoje) {
        List<Titulo> todos     = tituloRepository.findParaRelatorio(usuarioId, null);
        List<Titulo> emAberto  = todos.stream().filter(t -> !"PAGO".equals(t.getStatus())).toList();
        List<Titulo> vencidos  = todos.stream().filter(t -> "VENCIDO".equals(t.getStatus())).toList();
        List<Titulo> pendentes = todos.stream().filter(t -> "PENDENTE".equals(t.getStatus())).toList();

        String mesAtual = hoje.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        BigDecimal totalMes = todos.stream()
                .filter(t -> t.getEmissao() != null &&
                        t.getEmissao().format(DateTimeFormatter.ofPattern("yyyy-MM")).equals(mesAtual))
                .map(t -> t.getValor() != null ? t.getValor() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAberto = emAberto.stream()
                .map(t -> t.getSaldo() != null ? t.getSaldo() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal media = todos.isEmpty() ? BigDecimal.ZERO :
                totalMes.divide(BigDecimal.valueOf(Math.max(todos.size(), 1)), 2, RoundingMode.HALF_UP);

        List<Object[]> catRows = tituloRepository.porTipoGasto(usuarioId);
        List<Map<String, Object>> categorias = catRows.stream().limit(MAX_CATEGORIAS).map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("categoria", row[0]); m.put("valor", row[1]);
            return m;
        }).toList();

        String maiorCategoria = categorias.isEmpty() ? "Não identificada"
                : String.valueOf(categorias.get(0).get("categoria"));

        LocalDate limite = hoje.plusDays(DIAS_PROX_VENC);
        List<Map<String, Object>> proximosVenc = pendentes.stream()
                .filter(t -> t.getVencimento() != null
                        && !t.getVencimento().isBefore(hoje)
                        && !t.getVencimento().isAfter(limite))
                .sorted(Comparator.comparing(Titulo::getVencimento))
                .limit(MAX_VENC_PROX)
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("descricao", t.getFornecedorNome());
                    m.put("valor", t.getSaldo());
                    m.put("vencimento", t.getVencimento().toString());
                    return m;
                }).toList();

        List<Map<String, Object>> maioresGastos = emAberto.stream()
                .sorted(Comparator.comparing(
                        t -> t.getSaldo() != null ? t.getSaldo() : BigDecimal.ZERO,
                        Comparator.reverseOrder()))
                .limit(3)
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("descricao", t.getFornecedorNome());
                    m.put("valor", t.getSaldo());
                    return m;
                }).toList();

        String periodoRef = hoje.format(DateTimeFormatter.ofPattern("MMMM/yyyy", new Locale("pt", "BR")));

        return new ResumoFinanceiro(periodoRef, totalMes, totalAberto, emAberto.size(),
                vencidos.size(), maiorCategoria, categorias, proximosVenc, maioresGastos,
                todos.size(), media);
    }

    // ── Chama OpenAI ──────────────────────────────────────────────────────────

    private String chamarOpenAi(ResumoFinanceiro r, String bot) {
        String requestBody = """
                {
                  "model": "gpt-4o-mini",
                  "messages": [
                    {"role": "system", "content": %s},
                    {"role": "user",   "content": %s}
                  ],
                  "max_tokens": 200,
                  "temperature": %s
                }
                """.formatted(
                jsonString(systemPromptParaBot(bot)),
                jsonString("Analise este resumo financeiro e gere o insight:\n" + montarJsonResumo(r)),
                switch (bot) { case "frank" -> "0.2"; case "anne" -> "0.3"; default -> "0.7"; }
        );

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openAiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("OpenAI status {}: {}", response.statusCode(), response.body());
                return gerarInsightFallback(r);
            }
            return extrairTexto(response.body());

        } catch (Exception e) {
            log.error("Erro ao chamar OpenAI: {}", e.getMessage());
            return gerarInsightFallback(r);
        }
    }

    private String systemPromptParaBot(String bot) {
        return switch (bot) {

            case "aurora" -> """
                    Você é Aurora, uma assistente financeira divertida, leve e bem-humorada.
                    Você é muito engraçada mas JAMAIS faça piadas que possam nos comprometer.
                    Use linguagem descontraída, emojis com moderação e analogias do cotidiano.
                    Analise o resumo financeiro e gere exatamente 3 frases curtas em português brasileiro.
                    Regras: máximo de 3 frases · tom leve e encorajador · no máximo 1 emoji por frase·
                    Lembre-se, apesar do mês de refencia ser esse enviado, os gastos podem ser para o futuro, por exemplo, um financiamento
                    não quer dizer que o cliente gastou o valor inteiro em no mês de referencia .
                    se houver vencidos mencione com leveza · finalize com incentivo ·
                    não invente dados que não estejam no resumo.""";

            case "frank" -> """
                    Você é Frank, um consultor financeiro sério, direto e profissional.
                    Analise o resumo financeiro e gere exatamente 3 frases objetivas em português brasileiro.
                    Regras: máximo de 3 frases · linguagem formal sem emojis · priorize alertas de
                    inadimplência e vencimentos · mencione valores concretos quando relevante ·
                    Lembre-se, apesar do mês de refencia ser esse enviado, os gastos podem ser para o futuro, por exemplo, um financiamento
                    não quer dizer que o cliente gastou o valor inteiro em no mês de referencia .
                    finalize com recomendação de ação · não invente dados.""";

            case "anne" -> """
                    Você é Anne, uma analista financeira especializada em padrões de gastos e inteligência financeira.
                    Analise o resumo financeiro e gere exatamente 3 frases analíticas em português brasileiro.
                    Regras: máximo de 3 frases · foque em padrões e concentração de gastos ·
                    Lembre-se, apesar do mês de refencia ser esse enviado, os gastos podem ser para o futuro, por exemplo, um financiamento
                    não quer dizer que o cliente gastou o valor inteiro em no mês de referencia .
                    inclua observação sobre saúde financeira · finalize com dica estratégica de
                    organização ou priorização · não invente dados · tom analítico mas acessível.""";

            default -> systemPromptParaBot("aurora");
        };
    }

    // ── Parser da resposta OpenAI ─────────────────────────────────────────────

    private String extrairTexto(String json) {
        try {
            int msgIdx = json.indexOf("\"message\":");
            if (msgIdx < 0) return gerarInsightFallback(null);

            int contentIdx = json.indexOf("\"content\":", msgIdx);
            if (contentIdx < 0) return gerarInsightFallback(null);

            int afterColon = contentIdx + 10;
            while (afterColon < json.length() && json.charAt(afterColon) == ' ') afterColon++;

            if (afterColon >= json.length() || json.startsWith("null", afterColon))
                return gerarInsightFallback(null);

            if (json.charAt(afterColon) != '"') return gerarInsightFallback(null);

            StringBuilder sb = new StringBuilder();
            int i = afterColon + 1;
            while (i < json.length()) {
                char c = json.charAt(i);
                if (c == '\\' && i + 1 < json.length()) {
                    char next = json.charAt(i + 1);
                    switch (next) {
                        case '"'  -> { sb.append('"');  i += 2; }
                        case '\\' -> { sb.append('\\'); i += 2; }
                        case 'n'  -> { sb.append(' ');  i += 2; }
                        case 'r'  -> {                  i += 2; }
                        case 't'  -> { sb.append(' ');  i += 2; }
                        default   -> { sb.append(next); i += 2; }
                    }
                } else if (c == '"') {
                    break;
                } else {
                    sb.append(c);
                    i++;
                }
            }

            String resultado = sb.toString().trim();
            return resultado.isBlank() ? gerarInsightFallback(null) : resultado;

        } catch (Exception e) {
            log.error("Erro ao parsear resposta OpenAI: {}", e.getMessage());
            return gerarInsightFallback(null);
        }
    }

    // ── Fallback ──────────────────────────────────────────────────────────────

    private String gerarInsightFallback(ResumoFinanceiro r) {
        if (r == null) return "Não foi possível gerar o insight no momento. Tente novamente mais tarde.";
        StringBuilder sb = new StringBuilder();
        if (r.quantidadeTitulosVencidos() > 0)
            sb.append("Você tem ").append(r.quantidadeTitulosVencidos()).append(" título(s) vencido(s) em aberto. ");
        if (!r.vencimentosProximos().isEmpty())
            sb.append("Há vencimentos nos próximos dias — fique atento. ");
        if (r.totalEmAberto().compareTo(BigDecimal.ZERO) > 0)
            sb.append("Total em aberto: R$ ").append(r.totalEmAberto()
                    .setScale(2, RoundingMode.HALF_UP).toString().replace(".", ",")).append(".");
        return sb.toString().isBlank()
                ? "Seus dados estão sendo acompanhados. Continue registrando títulos para insights mais detalhados."
                : sb.toString().trim();
    }

    // ── Serialização do resumo ────────────────────────────────────────────────

    private String montarJsonResumo(ResumoFinanceiro r) {
        return """
                {
                  "periodoReferencia": "%s",
                  "totalGastoMes": %.2f,
                  "totalEmAberto": %.2f,
                  "quantidadeTitulosEmAberto": %d,
                  "quantidadeTitulosVencidos": %d,
                  "maiorCategoria": "%s",
                  "categoriasMaisRelevantes": %s,
                  "vencimentosProximos": %s,
                  "maioresGastosRecentes": %s,
                  "quantidadeLancamentos": %d,
                  "mediaValorTitulos": %.2f
                }
                """.formatted(
                r.periodoReferencia(), r.totalGastoMes().doubleValue(),
                r.totalEmAberto().doubleValue(), r.quantidadeTitulosEmAberto(),
                r.quantidadeTitulosVencidos(), r.maiorCategoria(),
                listaParaJson(r.categoriasMaisRelevantes()),
                listaParaJson(r.vencimentosProximos()),
                listaParaJson(r.maioresGastosRecentes()),
                r.quantidadeLancamentos(), r.mediaValorTitulos().doubleValue()
        );
    }

    private String listaParaJson(List<Map<String, Object>> lista) {
        if (lista.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < lista.size(); i++) {
            sb.append("{");
            lista.get(i).forEach((k, v) -> {
                sb.append("\"").append(k).append("\":");
                if (v instanceof Number) sb.append(v);
                else sb.append("\"").append(v).append("\"");
                sb.append(",");
            });
            if (sb.charAt(sb.length() - 1) == ',') sb.deleteCharAt(sb.length() - 1);
            sb.append("}");
            if (i < lista.size() - 1) sb.append(",");
        }
        return sb.append("]").toString();
    }

    private String jsonString(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "") + "\"";
    }

    private Map<String, Object> resposta(String texto, boolean novo, String bot) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("insight",    texto);
        r.put("geradoHoje", novo);
        r.put("bot",        bot);
        r.put("geradoEm",   LocalDate.now().toString());
        return r;
    }

    public record ResumoFinanceiro(
            String periodoReferencia, BigDecimal totalGastoMes, BigDecimal totalEmAberto,
            int quantidadeTitulosEmAberto, int quantidadeTitulosVencidos, String maiorCategoria,
            List<Map<String, Object>> categoriasMaisRelevantes,
            List<Map<String, Object>> vencimentosProximos,
            List<Map<String, Object>> maioresGastosRecentes,
            int quantidadeLancamentos, BigDecimal mediaValorTitulos
    ) {}
}