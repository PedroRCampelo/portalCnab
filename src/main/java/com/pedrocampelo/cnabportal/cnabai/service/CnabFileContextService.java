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

    private static final int MAX_LINHAS = 80;

    /**
     * Extrai o banco normalizado do arquivo para uso na priorização de chunks.
     * Retorna "itau", "bradesco", "bb", "caixa", "sicredi", etc. ou null se não identificado.
     */
    public String detectarBancoDoArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) return null;
        try {
            List<String> linhas = lerLinhas(arquivo);
            String bancoDetectado = detectarBanco(linhas);
            if (bancoDetectado == null) return null;
            // Normaliza para o mesmo formato usado no bank_code do banco de dados
            String d = bancoDetectado.toLowerCase();
            if (d.contains("itau") || d.contains("itaú") || d.contains("341")) return "itau";
            if (d.contains("bradesco") || d.contains("237"))                    return "bradesco";
            if (d.contains("brasil") || d.contains("001"))                      return "bb";
            if (d.contains("caixa") || d.contains("104"))                       return "caixa";
            if (d.contains("sicredi") || d.contains("748"))                     return "sicredi";
            if (d.contains("sicoob") || d.contains("756"))                      return "sicoob";
            if (d.contains("santander") || d.contains("033"))                   return "santander";
            if (d.contains("banrisul") || d.contains("041"))                    return "banrisul";
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public String buildFileContext(MultipartFile arquivo, String bancoSelecionado, String tipoSelecionado) {
        if (arquivo == null || arquivo.isEmpty()) return "";

        try {
            List<String> linhas = lerLinhas(arquivo);
            if (linhas.isEmpty()) return "";

            // Detecta banco e layout diretamente do arquivo
            String bancoDetectado = detectarBanco(linhas);
            int    larguraDetectada = detectarLargura(linhas);
            String versaoDetectada  = larguraDetectada == 400 ? "400" : "240";

            // Usa detectado; fallback para o que o usuário selecionou
            String bancoFinal  = bancoDetectado != null ? bancoDetectado
                    : (bancoSelecionado != null && !bancoSelecionado.isBlank() ? bancoSelecionado : "não identificado");
            String versaoFinal = versaoDetectada;

            log.info("[CnabFileContext] arquivo={} linhas={} bancoDetectado={} larguraDetectada={} enviandoParaIA={}",
                    arquivo.getOriginalFilename(), linhas.size(), bancoDetectado, larguraDetectada,
                    Math.min(linhas.size(), MAX_LINHAS));

            // Distribuição de tipos de registro
            Map<String, Long> porTipo = linhas.stream()
                    .filter(l -> l.length() >= 8)
                    .collect(Collectors.groupingBy(
                            l -> identificarTipoRegistro(l, larguraDetectada),
                            Collectors.counting()
                    ));

            List<String> linhasParaEnviar = linhas.stream().limit(MAX_LINHAS).toList();

            StringBuilder sb = new StringBuilder();
            sb.append("=== CONTEXTO DO ARQUIVO CNAB DO USUÁRIO ===\n");
            sb.append("- Arquivo: ").append(arquivo.getOriginalFilename()).append("\n");
            sb.append("- Banco identificado no arquivo: ").append(bancoFinal).append("\n");
            sb.append("- Layout CNAB: ").append(versaoFinal).append(" posições\n");
            sb.append("- Total de linhas: ").append(linhas.size()).append("\n");
            sb.append("- Distribuição por tipo de registro: ").append(porTipo).append("\n");

            // Alertas de largura incorreta
            long linhasErradas = linhas.stream().filter(l -> l.length() != larguraDetectada).count();
            if (linhasErradas > 0) {
                sb.append("- AVISO: ").append(linhasErradas)
                        .append(" linha(s) com largura diferente de ").append(larguraDetectada).append("\n");
            }

            sb.append("\nIMPORTANTE: Este arquivo é do banco ").append(bancoFinal)
                    .append(". Use EXCLUSIVAMENTE documentação deste banco para interpretar os campos.\n");

            sb.append("\nCONTEÚDO (primeiras ").append(linhasParaEnviar.size()).append(" linhas):\n");
            sb.append("[nº | largura | tipo | conteúdo]\n---\n");

            for (int i = 0; i < linhasParaEnviar.size(); i++) {
                String linha = linhasParaEnviar.get(i);
                String tipoReg = identificarTipoRegistro(linha, larguraDetectada);
                sb.append(String.format("L%03d | %d | %s | %s%n",
                        i + 1, linha.length(), tipoReg, linha));
            }

            if (linhas.size() > MAX_LINHAS) {
                sb.append("... (").append(linhas.size() - MAX_LINHAS).append(" linhas omitidas)\n");
            }

            return sb.toString();

        } catch (Exception e) {
            log.error("[CnabFileContext] Erro ao processar arquivo: {}", e.getMessage());
            return "=== CONTEXTO DO ARQUIVO CNAB ===\nErro ao ler o arquivo: " + e.getMessage() + "\n";
        }
    }

    /**
     * Detecta o banco pelo código presente no header do arquivo.
     * CNAB 400: posições 77-79 (código do banco cedente)
     * CNAB 240: posições 1-3 (código do banco)
     */
    private String detectarBanco(List<String> linhas) {
        if (linhas.isEmpty()) return null;
        String header = linhas.get(0);

        // Tenta CNAB 400 — código do banco nas posições 77-79 ou 26-28
        if (header.length() >= 400) {
            // Posição 77-79: banco na remessa de cobrança CNAB 400
            String cod400 = header.substring(76, 79).trim();
            String banco = codigoParaNomeBanco(cod400);
            if (banco != null) return banco;
        }

        // Tenta CNAB 240 — código do banco nas posições 1-3
        if (header.length() >= 3) {
            String cod240 = header.substring(0, 3).trim();
            String banco = codigoParaNomeBanco(cod240);
            if (banco != null) return banco;
        }

        // Fallback: busca o código nas primeiras linhas por texto
        for (String linha : linhas.subList(0, Math.min(3, linhas.size()))) {
            if (linha.contains("ITAU") || linha.contains("ITAÚ")) return "Itaú (341)";
            if (linha.contains("BRADESCO"))                        return "Bradesco (237)";
            if (linha.contains("BANCO DO BRASIL"))                 return "Banco do Brasil (001)";
            if (linha.contains("CAIXA") || linha.contains("CEF")) return "Caixa Econômica Federal (104)";
            if (linha.contains("SICREDI"))                        return "Sicredi (748)";
            if (linha.contains("SICOOB"))                         return "Sicoob (756)";
            if (linha.contains("SANTANDER"))                      return "Santander (033)";
            if (linha.contains("BANRISUL"))                       return "Banrisul (041)";
        }

        return null;
    }

    private String codigoParaNomeBanco(String codigo) {
        return switch (codigo) {
            case "341" -> "Itaú (341)";
            case "237" -> "Bradesco (237)";
            case "001" -> "Banco do Brasil (001)";
            case "104" -> "Caixa Econômica Federal (104)";
            case "033" -> "Santander (033)";
            case "748" -> "Sicredi (748)";
            case "756" -> "Sicoob (756)";
            case "041" -> "Banrisul (041)";
            case "136" -> "Unicred (136)";
            case "077" -> "Inter (077)";
            case "260" -> "Nubank (260)";
            default    -> null;
        };
    }

    /**
     * Detecta a largura do layout pela mediana das linhas do arquivo.
     */
    private int detectarLargura(List<String> linhas) {
        long count400 = linhas.stream().filter(l -> l.length() == 400).count();
        long count240 = linhas.stream().filter(l -> l.length() == 240).count();
        return count400 >= count240 ? 400 : 240;
    }

    private List<String> lerLinhas(MultipartFile arquivo) throws Exception {
        for (String charset : new String[]{"UTF-8", "ISO-8859-1"}) {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(arquivo.getInputStream(), Charset.forName(charset)))) {
                List<String> linhas = reader.lines()
                        .map(l -> l.replace("\r", ""))
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