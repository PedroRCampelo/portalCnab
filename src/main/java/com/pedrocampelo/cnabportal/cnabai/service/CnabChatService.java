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

        // Busca semântica pura — sem filtro de banco/tipo
        List<RetrievedChunkDTO> todosChunks = vectorSearchService.searchRelevantChunks(
                request.getPergunta(),
                request.getBanco(),
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

        log.info("[CnabChat] chunks após threshold={}", chunks.size());

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
        String contextoBancoTipo = buildBancoTipoContext(request.getBanco(), request.getTipo());

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
        if ((banco == null || banco.isBlank()) && (tipo == null || tipo.isBlank())) {
            return "";
        }
        StringBuilder sb = new StringBuilder("CONTEXTO DA SESSÃO:\n");
        if (banco != null && !banco.isBlank()) {
            sb.append("- Banco selecionado pelo usuário: ").append(banco).append("\n");
        }
        if (tipo != null && !tipo.isBlank()) {
            sb.append("- Layout CNAB selecionado: ").append(tipo).append("\n");
        }
        sb.append("Use estas informações para contextualizar sua resposta, mas não restrinja " +
                "a análise apenas a esses parâmetros se o contexto fornecido for de outro banco.\n");
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
                Você é Elvis, especialista em CNAB 240 e CNAB 400 da plataforma Whallet.

                REGRAS CRÍTICAS:

                1. BANCO DO ARQUIVO TEM PRIORIDADE ABSOLUTA.
                   Quando houver "=== CONTEXTO DO ARQUIVO CNAB DO USUÁRIO ===" no contexto, leia o campo
                   "Banco identificado no arquivo" e use EXCLUSIVAMENTE documentação desse banco.
                   NUNCA responda com campos ou posições de outro banco, mesmo que os chunks da base
                   de conhecimento sejam de bancos diferentes.

                2. Se a base de conhecimento não tiver documentação do banco do arquivo, diga:
                   "Não tenho documentação do [banco] na base, mas analisarei o arquivo diretamente."
                   Analise então o conteúdo bruto do arquivo para responder.

                3. NUNCA misture informações de bancos diferentes.
                   Arquivo do Itaú → use apenas Itaú. Arquivo do Bradesco → apenas Bradesco.

                4. Ao analisar arquivo:
                   - Confirme banco, layout (240/400) e tipo (remessa/retorno)
                   - Leia os campos nas posições corretas para aquele banco específico
                   - Baseie a resposta no conteúdo real das linhas enviadas

                5. Sem arquivo: use a base de conhecimento. Se o banco não estiver na base,
                   informe e use o padrão FEBRABAN geral deixando isso explícito.

                6. Nunca invente posições, tamanhos ou regras de campo.

                FORMATO: Resposta direta → Fonte utilizada → Limitações se houver.
                """;
    }
}