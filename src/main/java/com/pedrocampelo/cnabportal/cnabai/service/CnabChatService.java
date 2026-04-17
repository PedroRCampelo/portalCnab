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

    @Value("${cnab.ai.max-context-chars:9000}")
    private int maxContextChars;

    @Value("${cnab.ai.min-similarity:0.35}")
    private double minSimilarity;

    public CnabChatResponseDTO chat(CnabChatRequestDTO request) {
        log.info("[CnabChat] pergunta='{}' banco='{}' tipo='{}'",
                request.getPergunta(), request.getBanco(), request.getTipo());

        // Busca com filtro de banco/tipo
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

        List<RetrievedChunkDTO> chunks = todosChunks.stream()
                .filter(c -> c.getSimilarity() != null && c.getSimilarity() >= minSimilarity)
                .toList();

        log.info("[CnabChat] chunks finais={}", chunks.size());

        String retrievedContext = buildRetrievedContext(chunks);
        String fileContext      = buildOptionalFileContext(request);

        boolean temArquivo = !fileContext.isBlank();
        boolean temChunks  = !chunks.isEmpty();

        log.info("[CnabChat] temArquivo={} temChunks={} fileContextLen={}",
                temArquivo, temChunks, fileContext.length());

        // Se não tem nem chunks nem arquivo, retorna direto sem chamar a IA
        if (!temChunks && !temArquivo) {
            String semContexto = "Não há documentação disponível para o banco/versão selecionado na base de conhecimento. " +
                    "Por favor, ingira o manual correspondente ou envie o arquivo de remessa como contexto.";
            return CnabChatResponseDTO.builder()
                    .resposta(semContexto)
                    .fontes(chunks)
                    .build();
        }

        String finalContext = trimContext(retrievedContext + "\n\n" + fileContext);

        String input = """
                PERGUNTA DO USUARIO:
                %s

                CONTEXTO:
                %s
                """.formatted(request.getPergunta(), finalContext);

        String answer = openAiResponseService.generateAnswer(systemPrompt(), input);

        return CnabChatResponseDTO.builder()
                .resposta(answer)
                .fontes(chunks)
                .build();
    }

    private String buildRetrievedContext(List<RetrievedChunkDTO> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "Nenhum trecho relevante foi encontrado na base de conhecimento.";
        }

        return chunks.stream()
                .map(chunk -> """
                        [FONTE]
                        Documento: %s
                        Banco: %s
                        Tipo: %s
                        Segmento: %s
                        Similaridade: %.4f
                        Trecho:
                        %s
                        """.formatted(
                        nullSafe(chunk.getSourceName()),
                        nullSafe(chunk.getBankCode()),
                        nullSafe(chunk.getCnabType()),
                        nullSafe(chunk.getSegmentCode()),
                        chunk.getSimilarity() == null ? 0.0 : chunk.getSimilarity(),
                        chunk.getContent()
                ))
                .collect(Collectors.joining("\n\n"));
    }

    private String buildOptionalFileContext(CnabChatRequestDTO request) {
        if (Boolean.TRUE.equals(request.getUsarArquivoAtualComoContexto())
                && request.getArquivoCnab() != null
                && !request.getArquivoCnab().isEmpty()) {
            log.info("[CnabChat] Processando arquivo de contexto: {} ({} bytes)",
                    request.getArquivoCnab().getOriginalFilename(),
                    request.getArquivoCnab().getSize());
            return cnabFileContextService.buildFileContext(
                    request.getArquivoCnab(),
                    request.getBanco(),
                    request.getTipo()
            );
        }
        log.info("[CnabChat] Sem arquivo de contexto — usarArquivo={} arquivo={}",
                request.getUsarArquivoAtualComoContexto(),
                request.getArquivoCnab() != null ? request.getArquivoCnab().getOriginalFilename() : "null");
        return "";
    }

    private String trimContext(String context) {
        if (context.length() <= maxContextChars) return context;
        return context.substring(0, maxContextChars);
    }

    private String nullSafe(String value) {
        return value == null ? "-" : value;
    }

    private String systemPrompt() {
        return """
                Você é um especialista em CNAB 240 e CNAB 400, com foco em layouts bancários brasileiros.

                Regras obrigatórias:
                1. Responda APENAS com base no CONTEXTO fornecido. Nunca use conhecimento externo.
                2. Não invente campos, posições, segmentos, regras bancárias ou interpretações.
                3. NUNCA misture informações de bancos diferentes. Se o contexto é do Itaú, não aplique ao Bradesco e vice-versa.
                4. Se houver "CONTEXTO DO ARQUIVO CNAB DO USUARIO" no contexto, analise o arquivo e responda com base nele —
                   mesmo que não haja trechos da base de conhecimento. Identifique erros, inconsistências ou explique o conteúdo.
                5. Se o contexto estiver completamente vazio, diga:
                   "Não há documentação disponível para o banco/versão selecionado. Por favor, ingira o manual ou envie o arquivo de remessa."
                6. Se a resposta não estiver claramente suportada pelo contexto, diga:
                   "Não encontrei informação suficiente no contexto fornecido para responder com segurança."
                7. Ao citar algo técnico, seja específico: mencione o banco e a versão do documento.
                8. Explique termos técnicos quando isso ajudar a compreensão.
                9. Organize a resposta em:
                   - Resposta
                   - Base utilizada
                   - Observações ou limitações

                Seu objetivo é ser preciso, confiável e útil. Precisão é mais importante que completude.
                """;
    }
}