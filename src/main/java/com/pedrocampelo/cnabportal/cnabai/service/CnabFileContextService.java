package com.pedrocampelo.cnabportal.cnabai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CnabFileContextService {

    // Máximo de linhas enviadas para a IA — evita estourar o contexto
    private static final int MAX_LINHAS = 60;

    public String buildFileContext(MultipartFile arquivo, String banco, String tipo) {
        if (arquivo == null || arquivo.isEmpty()) return "";

        try {
            // Lê o arquivo linha a linha (tenta UTF-8, fallback ISO-8859-1)
            List<String> linhas = lerLinhas(arquivo);

            if (linhas.isEmpty()) return "";

            String versao  = tipo == null ? "240" : tipo.replace("cnab", "").trim();
            int    largura = "400".equals(versao) ? 400 : 240;

            // Distribução de tipos de registro
            Map<String, Long> porTipo = linhas.stream()
                    .filter(l -> l.length() >= 8)
                    .collect(Collectors.groupingBy(
                            l -> identificarTipoRegistro(l, largura),
                            Collectors.counting()
                    ));

            // Conteúdo bruto das linhas (limitado para não explodir o contexto)
            List<String> linhasParaEnviar = linhas.stream()
                    .limit(MAX_LINHAS)
                    .toList();

            StringBuilder sb = new StringBuilder();
            sb.append("CONTEXTO DO ARQUIVO CNAB DO USUÁRIO\n");
            sb.append("- Arquivo: ").append(arquivo.getOriginalFilename()).append("\n");
            sb.append("- Banco selecionado: ").append(banco != null ? banco : "não informado").append("\n");
            sb.append("- Versão CNAB: ").append(versao).append("\n");
            sb.append("- Total de linhas: ").append(linhas.size()).append("\n");
            sb.append("- Largura esperada por linha: ").append(largura).append(" caracteres\n");
            sb.append("- Distribuição por tipo de registro: ").append(porTipo).append("\n");

            // Alertas de largura incorreta
            List<String> linhasComLarguraErrada = linhas.stream()
                    .filter(l -> l.length() != largura)
                    .limit(5)
                    .toList();
            if (!linhasComLarguraErrada.isEmpty()) {
                sb.append("- AVISO: ").append(linhasComLarguraErrada.size())
                        .append(" linha(s) com largura diferente de ").append(largura).append(" caracteres\n");
            }

            sb.append("\nCONTEÚDO DO ARQUIVO (primeiras ").append(linhasParaEnviar.size()).append(" linhas):\n");
            sb.append("Formato: [nº linha | largura | tipo | conteúdo bruto]\n");
            sb.append("---\n");

            for (int i = 0; i < linhasParaEnviar.size(); i++) {
                String linha = linhasParaEnviar.get(i);
                String tipoReg = identificarTipoRegistro(linha, largura);
                sb.append(String.format("L%03d | %d chars | %s | %s%n",
                        i + 1, linha.length(), tipoReg, linha));
            }

            if (linhas.size() > MAX_LINHAS) {
                sb.append("... (").append(linhas.size() - MAX_LINHAS).append(" linhas omitidas)\n");
            }

            log.info("[CnabFileContext] arquivo={} linhas={} enviandoParaIA={}",
                    arquivo.getOriginalFilename(), linhas.size(), linhasParaEnviar.size());

            return sb.toString();

        } catch (Exception e) {
            log.error("[CnabFileContext] Erro ao processar arquivo: {}", e.getMessage());
            return "CONTEXTO DO ARQUIVO CNAB DO USUÁRIO\n" +
                    "Não foi possível ler o arquivo. Erro: " + e.getMessage() + "\n";
        }
    }

    private List<String> lerLinhas(MultipartFile arquivo) throws Exception {
        // Tenta UTF-8 primeiro, depois ISO-8859-1 (comum em arquivos bancários brasileiros)
        for (String charset : new String[]{"UTF-8", "ISO-8859-1"}) {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(arquivo.getInputStream(), Charset.forName(charset)))) {
                List<String> linhas = reader.lines()
                        .map(l -> l.replace("\r", "")) // remove CR
                        .filter(l -> !l.isBlank())
                        .collect(Collectors.toList());
                if (!linhas.isEmpty()) return linhas;
            }
        }
        return Collections.emptyList();
    }

    private String identificarTipoRegistro(String linha, int largura) {
        if (linha == null || linha.length() < 8) return "CURTA";

        if (largura == 240) {
            // CNAB 240: posição 8 (índice 7) = tipo de registro
            char tipo = linha.charAt(7);
            return switch (tipo) {
                case '0' -> "HEADER-ARQUIVO";
                case '1' -> "HEADER-LOTE";
                case '3' -> "DETALHE";
                case '5' -> "TRAILER-LOTE";
                case '9' -> "TRAILER-ARQUIVO";
                default  -> "TIPO-" + tipo;
            };
        } else {
            // CNAB 400: posição 1 (índice 0) = tipo
            char tipo = linha.charAt(0);
            return switch (tipo) {
                case '0' -> "HEADER";
                case '1' -> "DETALHE";
                case '9' -> "TRAILER";
                default  -> "TIPO-" + tipo;
            };
        }
    }
}