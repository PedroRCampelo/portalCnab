package com.pedrocampelo.cnabportal.cnabai.service;

import com.pedrocampelo.cnabportal.cnabai.dto.CnabChatRequestDTO;
import com.pedrocampelo.cnabportal.cnabai.dto.CnabChatResponseDTO;
import com.pedrocampelo.cnabportal.cnabai.dto.RetrievedChunkDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CnabChatService {

    private final VectorSearchService vectorSearchService;
    private final OpenAiResponseService openAiResponseService;
    private final CnabFileContextService cnabFileContextService;

    @Value("${cnab.ai.max-context-chars:32000}")
    private int maxContextChars;

    @Value("${cnab.ai.min-similarity:0.30}")
    private double minSimilarity;

    public CnabChatResponseDTO chat(CnabChatRequestDTO request) {
        log.info("[CnabChat] pergunta='{}' banco='{}' tipo='{}'",
                request.getPergunta(), request.getBanco(), request.getTipo());

        // Determina banco efetivo ANTES da busca para enriquecer o embedding
        // dropdown > arquivo > null
        String bancoDropdown = request.getBanco();
        String bancoArquivo  = null;
        if ((bancoDropdown == null || bancoDropdown.isBlank())
                && Boolean.TRUE.equals(request.getUsarArquivoAtualComoContexto())
                && request.getArquivoCnab() != null && !request.getArquivoCnab().isEmpty()) {
            bancoArquivo = cnabFileContextService.detectarBancoDoArquivo(request.getArquivoCnab());
            if (bancoArquivo != null) {
                log.info("[CnabChat] banco não selecionado no dropdown — detectado no arquivo: {}", bancoArquivo);
            }
        }
        String bancoEfetivo = (bancoDropdown != null && !bancoDropdown.isBlank()) ? bancoDropdown : bancoArquivo;

        // Busca semântica com query enriquecida pelo banco detectado
        List<RetrievedChunkDTO> todosChunks = vectorSearchService.searchRelevantChunks(
                request.getPergunta(),
                bancoEfetivo,
                request.getTipo()
        );

        log.info("[CnabChat] chunks recuperados={} | similaridades={}",
                todosChunks.size(),
                todosChunks.stream()
                        .map(c -> String.format("%.4f", c.getSimilarity()))
                        .collect(Collectors.joining(", ")));

        // Filtra por threshold mínimo de similaridade
        List<RetrievedChunkDTO> chunks = todosChunks.stream()
                .filter(c -> c.getSimilarity() != null && c.getSimilarity() >= minSimilarity)
                .toList();

        // Se banco foi especificado (dropdown ou arquivo), prioriza chunks desse banco e tipo
        String bancoNorm = normalizarBanco(bancoEfetivo);
        String tipoNorm  = normalizarTipo(request.getTipo());

        if (bancoNorm != null) {
            // Tenta filtrar por banco + tipo
            List<RetrievedChunkDTO> chunksExatos = chunks.stream()
                    .filter(c -> bancoNorm.equalsIgnoreCase(c.getBankCode())
                            && (tipoNorm == null || tipoNorm.equalsIgnoreCase(c.getCnabType())))
                    .toList();

            // Se não encontrou com tipo exato, tenta só pelo banco
            List<RetrievedChunkDTO> chunksCorretos = !chunksExatos.isEmpty() ? chunksExatos :
                    chunks.stream()
                            .filter(c -> bancoNorm.equalsIgnoreCase(c.getBankCode()))
                            .toList();

            if (!chunksCorretos.isEmpty()) {
                chunks = chunksCorretos;
                log.info("[CnabChat] banco={} tipo={} → usando {} chunks (banco+tipo={}, descartados={})",
                        bancoNorm, tipoNorm, chunksCorretos.size(),
                        chunksExatos.size(), todosChunks.size() - chunksCorretos.size());
            } else {
                log.info("[CnabChat] banco={} tipo={} → nenhum chunk encontrado, usando busca geral", bancoNorm, tipoNorm);
            }
        }

        log.info("[CnabChat] chunks finais={}", chunks.size());

        String fileContext = buildOptionalFileContext(request);
        boolean temArquivo = !fileContext.isBlank();
        boolean temChunks  = !chunks.isEmpty();

        log.info("[CnabChat] temArquivo={} temChunks={} fileContextLen={}",
                temArquivo, temChunks, fileContext.length());

        String retrievedContext = buildRetrievedContext(chunks);

        // Arquivo tem prioridade — se tiver que cortar, corta os chunks, não o arquivo
        String finalContext;
        if (temArquivo) {
            int espacoParaChunks = Math.max(0, maxContextChars - fileContext.length());
            String chunksLimitados = retrievedContext.length() > espacoParaChunks
                    ? retrievedContext.substring(0, espacoParaChunks) + "\n[chunks da base truncados para caber o arquivo]"
                    : retrievedContext;
            finalContext = chunksLimitados + "\n\n" + fileContext;
        } else {
            finalContext = trimContext(retrievedContext);
        }

        // Monta contexto do banco/tipo selecionado para ajudar a IA
        String contextoBancoTipo = buildBancoTipoContext(bancoEfetivo, request.getTipo());

        String input = """
                %s

                PERGUNTA DO USUARIO:
                %s

                CONTEXTO DA BASE DE CONHECIMENTO:
                %s
                """.formatted(contextoBancoTipo, request.getPergunta(), finalContext);

        String answer = openAiResponseService.generateAnswer(systemPrompt(), input);

        return CnabChatResponseDTO.builder()
                .resposta(answer)
                .fontes(chunks)
                .build();
    }

    private String buildBancoTipoContext(String banco, String tipo) {
        boolean temBanco = banco != null && !banco.isBlank();
        boolean temTipo  = tipo  != null && !tipo.isBlank();

        StringBuilder sb = new StringBuilder("CONTEXTO DA SESSÃO:\n");

        if (temBanco) {
            sb.append("- Banco especificado pelo usuário: ").append(banco).append("\n");
            sb.append("  → Responda usando APENAS documentação do ").append(banco).append(".\n");
        } else {
            sb.append("- Banco: NÃO especificado.\n");
            sb.append("  → Se a pergunta depender de posições/campos específicos de um banco,\n");
            sb.append("    pergunte ao usuário qual banco ele quer saber.\n");
            sb.append("    Se for um conceito geral CNAB/FEBRABAN, responda de forma generalista.\n");
        }

        if (temTipo) {
            sb.append("- Layout CNAB: ").append(tipo).append("\n");
        } else {
            sb.append("- Layout CNAB: não especificado (240 ou 400).\n");
        }

        return sb.toString();
    }

    private String buildRetrievedContext(List<RetrievedChunkDTO> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "Nenhum trecho relevante foi encontrado na base de conhecimento para esta pergunta.";
        }

        return chunks.stream()
                .map(chunk -> """
                        [FONTE: %s | Banco: %s | Tipo: %s | Similaridade: %.4f]
                        %s
                        """.formatted(
                        nullSafe(chunk.getSourceName()),
                        nullSafe(chunk.getBankCode()),
                        nullSafe(chunk.getCnabType()),
                        chunk.getSimilarity() == null ? 0.0 : chunk.getSimilarity(),
                        chunk.getContent()
                ))
                .collect(Collectors.joining("\n\n"));
    }

    private String buildOptionalFileContext(CnabChatRequestDTO request) {
        if (Boolean.TRUE.equals(request.getUsarArquivoAtualComoContexto())
                && request.getArquivoCnab() != null
                && !request.getArquivoCnab().isEmpty()) {
            log.info("[CnabChat] Processando arquivo: {} ({} bytes)",
                    request.getArquivoCnab().getOriginalFilename(),
                    request.getArquivoCnab().getSize());
            return cnabFileContextService.buildFileContext(
                    request.getArquivoCnab(),
                    request.getBanco(),
                    request.getTipo()
            );
        }
        return "";
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) return null;
        return switch (tipo.trim().toLowerCase()) {
            case "240", "cnab240", "cnab 240" -> "cnab240";
            case "400", "cnab400", "cnab 400" -> "cnab400";
            default -> tipo.trim().toLowerCase();
        };
    }

    private String normalizarBanco(String banco) {
        if (banco == null || banco.isBlank()) return null;
        return switch (banco.trim().toLowerCase()) {
            case "itau", "itaú", "341"          -> "itau";
            case "bradesco", "237"              -> "bradesco";
            case "bb", "banco do brasil", "001" -> "bb";
            case "caixa", "cef", "104"          -> "caixa";
            case "sicredi", "748"               -> "sicredi";
            case "sicoob", "756"                -> "sicoob";
            case "santander", "033"             -> "santander";
            case "banrisul", "041"              -> "banrisul";
            default -> banco.trim().toLowerCase();
        };
    }

    private String trimContext(String context) {
        if (context.length() <= maxContextChars) return context;
        return context.substring(0, maxContextChars) +
                "\n\n[Contexto truncado por limite de tamanho]";
    }

    private String nullSafe(String value) {
        return value == null ? "-" : value;
    }

    private String systemPrompt() {
        return """
                Você é Elvis, o melhor especialista em CNAB do Brasil. Faz parte da plataforma Whallet.
                Seu objetivo é dar respostas técnicas precisas, completas e práticas sobre layouts CNAB.

                REGRAS DE QUALIDADE — NUNCA ABRA MÃO DISSO:

                1. SEMPRE inclua posições de campo quando a pergunta envolver campos, juros, multa,
                   desconto, datas ou qualquer dado técnico. Se o contexto tiver a tabela de layout
                   com posições (ex: "127 141 JUROS DE 1 DIA"), CITE as posições.
                   Nunca responda "configure o campo X" sem dizer onde ele fica.

                2. VERIFIQUE O LAYOUT: cada [FONTE] indica banco E tipo (cnab240 ou cnab400).
                   Se o usuário pede CNAB 240 e só há chunks de CNAB 400, informe claramente.
                   Nunca misture layouts nem bancos diferentes.

                3. BANCO ESPECÍFICO: só responda com dados de um banco se ele estiver
                   identificado no contexto (dropdown, arquivo ou pergunta).
                   Sem banco: conceitos → responda genericamente.
                   Posições → pergunte qual banco.

                4. BANCO DO ARQUIVO TEM PRIORIDADE ABSOLUTA.
                   Leia "Banco identificado no arquivo" e use EXCLUSIVAMENTE esse banco.

                5. NUNCA invente posições, tamanhos, segmentos ou regras.
                   Se não encontrar no contexto, diga explicitamente.

                6. NUNCA invente fontes. Só cite o source_name se houver [FONTE] no contexto.

                FORMATO DE RESPOSTA:
                - Listas numeradas (1. 2. 3.) para itens principais
                - Bullets com hífen (  - item) para sub-itens
                - `código` para valores e posições de campos
                - Sempre que citar um campo: Nome | Posições | Formato | Observação
                  Exemplo: JUROS DE 1 DIA | posições 127-141 | 9(13)V9(2) | ver Nota 13
                - Fonte: [source_name do chunk]
                """;
    }
}