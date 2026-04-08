package com.pedrocampelo.cnabportal.service.cnabsv.reportsv;

import com.pedrocampelo.cnabportal.dto.CnabReportData;
import com.pedrocampelo.cnabportal.dto.CnabReportData.Alerta;
import com.pedrocampelo.cnabportal.dto.CnabReportData.Severidade;
import com.pedrocampelo.cnabportal.model.ParsedRecord;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Analisa uma List<ParsedRecord> e produz um CnabReportData completo.
 *
 * Lida com DUAS estruturas de arquivo:
 *
 *   CNAB 400  →  recordType "0"=header  "1"=detalhe  "9"=trailer
 *                Sem lotes; detalhes são os registros tipo "1".
 *
 *   CNAB 240  →  recordType "0"=header arquivo  "1"=header lote
 *                "3A"/"3J"/"3P"/"3Q"/"3O"/"3N"=detalhe  "5"=trailer lote  "9"=trailer arquivo
 *                Detalhes são os registros que começam com "3" e têm 2 chars.
 */
@Service
public class CnabAnalysisService {

    private static final DateTimeFormatter FMT_CNAB  = DateTimeFormatter.ofPattern("ddMMyyyy");
    private static final DateTimeFormatter FMT_EXIB  = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FMT_RELAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final Set<String> DATE_FIELDS = Set.of(
            "DATA_PAGTO", "DATA_EFETIVA", "DATA_VENCIMENTO", "VENCIMENTO",
            "DATA_GERACAO", "DATA_EMISSAO"
    );


    private boolean isDetailForPdf(String recordType) {
        if (recordType == null || recordType.isBlank()) {
            return false;
        }

        return switch (recordType) {
            case "3B", "3J52" -> false; // não entram no PDF
            case "3A", "3J", "3O", "3N", "3P", "3Q", "3W" -> true;
            default -> false;
        };
    }
    
    // ── Entrada pública ───────────────────────────────────────────────────────

    public CnabReportData analyze(
            List<ParsedRecord> records,
            String nomeArquivo,
            String modalidade,  // "PAGAMENTO" | "COBRANCA" | "COBRANÇA"
            String nomeBanco) {

        if (records == null || records.isEmpty()) {
            return emptyReport(nomeArquivo, modalidade, nomeBanco);
        }

        // ── Detecta estrutura: 240 ou 400 ─────────────────────────────────
        boolean is240 = records.stream()
                .anyMatch(r -> r.getRecordType().length() == 2
                        && r.getRecordType().startsWith("3"));

        // ── Metadados do Header Arquivo (tipo "0") ─────────────────────────
        String nomeEmpresa = "";
        String cnpjEmpresa = "";
        String dataGeracao = "";
        String tipoArquivo = "REMESSA";

        Optional<ParsedRecord> headerOpt = records.stream()
                .filter(r -> "0".equals(r.getRecordType()))
                .findFirst();

        if (headerOpt.isPresent()) {
            var h = headerOpt.get().getFields();
            nomeEmpresa = clean(h.getOrDefault("NOME_EMPRESA", ""));
            cnpjEmpresa = clean(h.getOrDefault("INSCRICAO_EMPRESA", ""));
            dataGeracao = fmtDate(clean(h.getOrDefault("DATA_GERACAO", "")));
            String cod  = clean(h.getOrDefault("ARQUIVO_CODIGO", "1"));
            tipoArquivo = "2".equals(cod) ? "RETORNO" : "REMESSA";
        }

        // Se nomeBanco não veio do header, tenta extrair do campo NOME_BANCO
        if (nomeBanco == null || nomeBanco.isBlank()) {
            nomeBanco = headerOpt.map(h -> clean(h.getFields().getOrDefault("NOME_BANCO",""))).orElse("");
        }

        String dataRelatorio = LocalDateTime.now().format(FMT_RELAT);
        String modalidadeNorm = modalidade == null ? "PAGAMENTO"
                : modalidade.replace("Ç","C").replace("ç","c").toUpperCase();

        // ── Registros de detalhe ──────────────────────────────────────────
        // CNAB 240: tipo "3x" (ex: "3A", "3J", "3P", "3Q")
        // CNAB 400: tipo "1"  (único registro de detalhe)

        List<ParsedRecord> detalhes = is240
                ? records.stream()
                .filter(r -> isDetailForPdf(r.getRecordType()))
                .toList()
                : records.stream()
                .filter(r -> "1".equals(r.getRecordType()))
                .toList();

        // ── Lotes (só existe no CNAB 240) ─────────────────────────────────
        // No CNAB 400, lote = 0 por definição
        int totalLotes = is240
                ? (int) records.stream().filter(r -> "1".equals(r.getRecordType())).count()
                : 0;

        int totalLinhas  = records.size();
        int totalTitulos = detalhes.size();

        // ── Valores monetários ────────────────────────────────────────────
        List<BigDecimal> valores = new ArrayList<>();
        for (ParsedRecord r : detalhes) {
            BigDecimal v = extractValue(r, is240);
            if (v != null && v.compareTo(BigDecimal.ZERO) > 0) valores.add(v);
        }

        BigDecimal valorTotal = valores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal valorMedio = valores.isEmpty() ? BigDecimal.ZERO
                : valorTotal.divide(BigDecimal.valueOf(valores.size()), 2, RoundingMode.HALF_UP);
        BigDecimal maiorValor = valores.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        BigDecimal menorValor = valores.stream()
                .filter(v -> v.compareTo(BigDecimal.ZERO) > 0)
                .min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        // ── Distribuição por tipo/segmento ────────────────────────────────
        Map<String, Long> contagemPorTipo = detalhes.stream()
                .collect(Collectors.groupingBy(ParsedRecord::getRecordType,
                        LinkedHashMap::new, Collectors.counting()));

        Map<String, BigDecimal> valorPorTipo = new LinkedHashMap<>();
        for (ParsedRecord r : detalhes) {
            BigDecimal v = extractValue(r, is240);
            if (v != null) valorPorTipo.merge(r.getRecordType(), v, BigDecimal::add);
        }

        // ── Linha do tempo por mês ────────────────────────────────────────
        Map<String, Integer>    titulosPorMes = new TreeMap<>();
        Map<String, BigDecimal> valorPorMes   = new TreeMap<>();

        for (ParsedRecord r : detalhes) {
            String mesAno = extractMesAno(r, is240);
            if (mesAno != null) {
                titulosPorMes.merge(mesAno, 1, Integer::sum);
                BigDecimal v = extractValue(r, is240);
                if (v != null) valorPorMes.merge(mesAno, v, BigDecimal::add);
            }
        }

        // ── Top favorecidos / cedentes / pagadores ────────────────────────
        List<String> topFavorecidos = detalhes.stream()
                .map(r -> bestName(r))
                .filter(s -> !s.isBlank())
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String,Long>comparingByValue().reversed())
                .limit(10)
                .map(Map.Entry::getKey)
                .toList();

        // ── Alertas ───────────────────────────────────────────────────────
        List<Alerta> alertas = buildAlertas(detalhes, records, is240, valorMedio);
        alertas.sort(Comparator.comparing(Alerta::severidade));

        return new CnabReportData(
                nomeEmpresa, cnpjEmpresa, nomeBanco, nomeArquivo,
                tipoArquivo, modalidadeNorm, dataGeracao, dataRelatorio,
                totalLinhas, totalTitulos, totalLotes,
                valorTotal, valorMedio, maiorValor, menorValor,
                contagemPorTipo, valorPorTipo,
                titulosPorMes, valorPorMes,
                alertas, topFavorecidos
        );
    }

    // ── Alertas ───────────────────────────────────────────────────────────────

    private List<Alerta> buildAlertas(List<ParsedRecord> detalhes,
                                      List<ParsedRecord> todos,
                                      boolean is240,
                                      BigDecimal valorMedio) {
        List<Alerta> alertas = new ArrayList<>();
        LocalDate hoje = LocalDate.now();

        // 1. Arquivo sem detalhes
        if (detalhes.isEmpty()) {
            alertas.add(new Alerta(Severidade.CRITICO, "Estrutura",
                    "Nenhum registro de detalhe encontrado", 0,
                    is240 ? "Nenhuma linha de tipo '3x' — verifique se o arquivo está completo."
                            : "Nenhuma linha de tipo '1' — verifique se o arquivo está completo."));
            return alertas; // não há mais nada para analisar
        }

        // 2. Nosso Número duplicado
        Map<String, Long> nossoNumeros = detalhes.stream()
                .map(r -> clean(r.getFields().getOrDefault("NOSSO_NUMERO", "")))
                .filter(s -> !s.isBlank() && !s.matches("0+"))
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()));
        long duplicados = nossoNumeros.values().stream().filter(c -> c > 1).count();
        if (duplicados > 0) {
            String ex = nossoNumeros.entrySet().stream()
                    .filter(e -> e.getValue() > 1).findFirst().map(Map.Entry::getKey).orElse("");
            alertas.add(new Alerta(Severidade.CRITICO, "Integridade",
                    "Nosso Número duplicado", (int) duplicados,
                    duplicados + " nos(s) número(s) repetido(s). Ex: " + ex));
        }

        // 3. Datas inválidas
        long datasInvalidas = detalhes.stream().filter(r -> hasInvalidDate(r)).count();
        if (datasInvalidas > 0) {
            alertas.add(new Alerta(Severidade.CRITICO, "Dados",
                    "Datas inválidas ou com formato incorreto", (int) datasInvalidas,
                    datasInvalidas + " registro(s) com campos de data não interpretáveis."));
        }

        // 4. Valor zero
        long valoresZero = detalhes.stream()
                .filter(r -> { BigDecimal v = extractValue(r, is240);
                    return v != null && v.compareTo(BigDecimal.ZERO) == 0; })
                .count();
        if (valoresZero > 0) {
            alertas.add(new Alerta(Severidade.ATENCAO, "Valor",
                    "Títulos com valor zero", (int) valoresZero,
                    valoresZero + " registro(s) com R$ 0,00 — verifique se são intencionais."));
        }

        // 5. Vencimento no passado
        long vencidos = detalhes.stream()
                .filter(r -> { LocalDate d = extractDate(r, "DATA_VENCIMENTO","VENCIMENTO","DATA_PAGTO");
                    return d != null && d.isBefore(hoje); })
                .count();
        if (vencidos > 0) {
            alertas.add(new Alerta(Severidade.ATENCAO, "Prazo",
                    "Vencimentos no passado", (int) vencidos,
                    vencidos + " título(s) com data anterior a " + hoje.format(FMT_EXIB) + "."));
        }

        // 6. Data futura > 1 ano
        LocalDate limite = hoje.plusYears(1);
        long futuro = detalhes.stream()
                .filter(r -> { LocalDate d = extractDate(r, "DATA_PAGTO","DATA_VENCIMENTO","VENCIMENTO");
                    return d != null && d.isAfter(limite); })
                .count();
        if (futuro > 0) {
            alertas.add(new Alerta(Severidade.ATENCAO, "Prazo",
                    "Pagamentos agendados além de 1 ano", (int) futuro,
                    futuro + " registro(s) com data superior a " + limite.format(FMT_EXIB) + "."));
        }

        // 7. Valores discrepantes (> 10× a média)
        if (valorMedio.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal teto = valorMedio.multiply(BigDecimal.TEN);
            long discrepantes = detalhes.stream()
                    .filter(r -> { BigDecimal v = extractValue(r, is240);
                        return v != null && v.compareTo(teto) > 0; })
                    .count();
            if (discrepantes > 0) {
                alertas.add(new Alerta(Severidade.ATENCAO, "Valor",
                        "Valores muito acima da média", (int) discrepantes,
                        discrepantes + " título(s) acima de 10× a média (R$ " +
                                valorMedio.setScale(2, RoundingMode.HALF_UP) + ")."));
            }
        }

        // 8. Nome não informado
        long semNome = detalhes.stream()
                .filter(r -> bestName(r).isBlank())
                .count();
        if (semNome > 0) {
            alertas.add(new Alerta(Severidade.ATENCAO, "Cadastro",
                    "Favorecido/pagador sem nome", (int) semNome,
                    semNome + " registro(s) sem identificação do beneficiário."));
        }

        // 9. Ocorrências de retorno preenchidas (INFO)
        long comOcorrencia = detalhes.stream()
                .filter(r -> { String oc = clean(r.getFields().getOrDefault("OCORRENCIAS",""));
                    return !oc.isBlank() && !oc.matches("0+") && !oc.matches("\\s+"); })
                .count();
        if (comOcorrencia > 0) {
            alertas.add(new Alerta(Severidade.INFO, "Retorno",
                    "Códigos de ocorrência preenchidos", (int) comOcorrencia,
                    comOcorrencia + " linha(s) com ocorrências — podem indicar rejeições no retorno bancário."));
        }

        return alertas;
    }

    // ── Helpers de extração ───────────────────────────────────────────────────

    /**
     * Campos de valor variam entre CNAB 240 e 400.
     * CNAB 240 (Pagamento):  VALOR_PAGTO (pos 120-134), VALOR_TITULO (seg J), VALOR_PRINCIPAL (seg N)
     * CNAB 240 (Cobrança):   VALOR_TITULO (seg P, pos 86-100)
     * CNAB 400:              VALOR_TITULO (pos 126-139 no CNAB 400 Itaú Cobrança)
     */
    private BigDecimal extractValue(ParsedRecord r, boolean is240) {
        List<String> campos = is240
                ? List.of("VALOR_PAGTO","VALOR_TITULO","VALOR_EFETIVO","VALOR_PRINCIPAL")
                : List.of("VALOR_TITULO","VALOR_PAGTO","VALOR_EFETIVO","VALOR_PRINCIPAL");

        for (String campo : campos) {
            String raw = clean(r.getFields().getOrDefault(campo, ""));
            if (!raw.isBlank() && raw.matches("\\d+") && !raw.matches("0+")) {
                try {
                    // CNAB usa vírgula assumida — últimas 2 casas são centavos
                    return BigDecimal.valueOf(Long.parseLong(raw), 2);
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    /** Campos de data variam entre 240 e 400 mas os nomes são os mesmos nos layouts. */
    private LocalDate extractDate(ParsedRecord r, String... campos) {
        for (String campo : campos) {
            String raw = clean(r.getFields().getOrDefault(campo, ""));
            if (raw.length() >= 8 && !raw.matches("0{8}.*")) {
                try { return LocalDate.parse(raw.substring(0, 8), FMT_CNAB); }
                catch (Exception ignored) {}
            }
        }
        return null;
    }

    private String extractMesAno(ParsedRecord r, boolean is240) {
        LocalDate d = is240
                ? extractDate(r, "DATA_PAGTO","DATA_VENCIMENTO","VENCIMENTO","DATA_EMISSAO")
                : extractDate(r, "VENCIMENTO","DATA_VENCIMENTO","DATA_PAGTO","DATA_EMISSAO");
        return d == null ? null : String.format("%04d-%02d", d.getYear(), d.getMonthValue());
    }

    private boolean hasInvalidDate(ParsedRecord r) {
        for (String campo : DATE_FIELDS) {
            String raw = clean(r.getFields().getOrDefault(campo, ""));
            if (raw.length() >= 8 && !raw.matches("0{8}.*")) {
                try { LocalDate.parse(raw.substring(0, 8), FMT_CNAB); }
                catch (Exception e) { return true; }
            }
        }
        return false;
    }

    /** Retorna o melhor nome disponível no registro (favorecido, cedente, pagador). */
    private String bestName(ParsedRecord r) {
        for (String campo : List.of(
                "NOME_FAVORECIDO","NOME_CEDENTE","NOME_PAGADOR",
                "NOME_CONCESSIONARIA","SACADOR_AVALISTA")) {
            String v = clean(r.getFields().getOrDefault(campo, ""));
            if (!v.isBlank()) return v;
        }
        return "";
    }

    private String clean(String s) { return s == null ? "" : s.trim(); }

    private String fmtDate(String raw) {
        if (raw == null || raw.length() < 8) return raw == null ? "—" : raw;
        try { return LocalDate.parse(raw.substring(0,8), FMT_CNAB).format(FMT_EXIB); }
        catch (Exception e) { return raw; }
    }

    private CnabReportData emptyReport(String nomeArquivo, String modalidade, String nomeBanco) {
        List<Alerta> alertas = List.of(new Alerta(Severidade.CRITICO, "Estrutura",
                "Arquivo vazio ou sem registros reconhecíveis", 0, "Verifique se o arquivo está correto."));
        return new CnabReportData(
                "—","—", nomeBanco == null ? "—" : nomeBanco, nomeArquivo,
                "REMESSA", modalidade == null ? "—" : modalidade,
                "—", LocalDateTime.now().format(FMT_RELAT),
                0,0,0,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                Map.of(), Map.of(), Map.of(), Map.of(),
                alertas, List.of()
        );
    }
}