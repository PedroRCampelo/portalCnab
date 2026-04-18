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

    @Value("${cnab.ai.max-context-chars:12000}")
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

        // Se não tem nem chunks nem arquivo, ainda tenta responder
        // com conhecimento geral sobre CNAB (sem contexto específico)
        String retrievedContext = buildRetrievedContext(chunks);
        String finalContext     = trimContext(retrievedContext + "\n\n" + fileContext);

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
                Você é Elvis, um especialista em CNAB 240 e CNAB 400 e em layouts bancários brasileiros.
                Você faz parte da plataforma Whallet — uma plataforma financeira com inteligência artificial.

                INSTRUÇÕES:
                1. Responda preferencialmente com base no CONTEXTO DA BASE DE CONHECIMENTO fornecido.
                2. Se o contexto for de um banco específico, deixe isso claro na resposta.
                3. NUNCA misture informações de bancos diferentes sem deixar isso explícito.
                4. Se houver "CONTEXTO DO ARQUIVO CNAB DO USUÁRIO", analise o arquivo e responda com
                   base nele — identificando erros, estrutura e inconsistências.
                5. Se não houver contexto suficiente na base de conhecimento, use seu conhecimento geral
                   sobre o padrão FEBRABAN/CNAB e deixe claro que é conhecimento geral, não documentação
                   específica do banco.
                6. Nunca invente posições de campo, tamanhos ou regras que não consiga confirmar.
                7. Quando citar campos técnicos, seja específico: posição, tamanho, tipo e conteúdo.
                8. Se a pergunta for sobre um banco não presente na base, informe isso e responda com
                   o padrão geral do CNAB — que pode variar por banco.

                FORMATO DA RESPOSTA:
                - Resposta clara e direta
                - Cite a fonte quando usar a base de conhecimento
                - Indique limitações quando o contexto for insuficiente

                Seu objetivo é ser preciso, útil e transparente sobre o nível de certeza das respostas.
                """;
    }
}