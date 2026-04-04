package com.pedrocampelo.cnabportal.service;

import com.pedrocampelo.cnabportal.model.ParsedRecord;
import com.pedrocampelo.cnabportal.util.CnabFormatUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExcelExportService {

    // ── Tab name maps ──────────────────────────────────────────────────────

    /** CNAB 400 Cobrança: recordType → nome da aba (igual ao comportamento original) */
    private static final Map<String, String> TAB_NAMES_400 = Map.of(
            "0", "Header",
            "1", "Detalhe",
            "2", "Complemento",
            "9", "Trailer"
    );

    /**
     * CNAB 240 Pagamento: recordType → nome da aba.
     *
     * [FIX-5] Adicionado "3J52" → "Seg J-52" para que o Segmento J-52
     *         (Sacador/Cedente/Sacado) tenha aba própria em vez de aparecer
     *         como linha extra e corrompida em "Seg J — Boletos".
     *
     * [FIX-6] Trocado Map.of() por LinkedHashMap para garantir a ordem de criação
     *         das abas no Excel (Map.of não garante ordem de iteração).
     *
     * [FIX-7] Nomes de aba sem '/' para evitar erro do Apache POI ao criar planilhas
     *         (caracteres inválidos: / \ : ? * [ ]).
     *         Antes: "Seg A — Crédito/TED/PIX" → POI lançava IllegalArgumentException.
     *         Agora: "Seg A — Cred TED PIX".
     */
    private static final Map<String, String> TAB_NAMES_240;
    static {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("0",    "Header Arquivo");
        m.put("1",    "Header Lote");
        m.put("3A",   "Seg A - Cred TED PIX");   // [FIX-7] removido '/'
        m.put("3J",   "Seg J - Boletos");          // [FIX-7] removido '—' e chars especiais
        m.put("3J52", "Seg J-52 - Sacador Ced");  // [FIX-5] adicionado
        m.put("3O",   "Seg O - Concessionarias"); // [FIX-7] removido '—' e acento
        m.put("3N",   "Seg N - Tributos");
        m.put("5",    "Trailer Lote");
        m.put("9",    "Trailer Arquivo");
        TAB_NAMES_240 = Collections.unmodifiableMap(m);
    }

    // ── Public API ─────────────────────────────────────────────────────────

    /**
     * Geração original — usada pelo endpoint /export (modo Protheus).
     * Mantida sem qualquer alteração para não quebrar o fluxo existente.
     */
    public byte[] generateExcel(
            String layoutFileName,
            String remessaFileName,
            List<ParsedRecord> parsedRecords) throws IOException {

        return generateExcel(layoutFileName, remessaFileName, parsedRecords, TAB_NAMES_400);
    }

    /**
     * Geração com mapa de abas customizado — usada pelo endpoint /export-bank.
     * Permite que CNAB 240 tenha abas com nomes descritivos por segmento.
     */
    public byte[] generateExcel(
            String layoutFileName,
            String remessaFileName,
            List<ParsedRecord> parsedRecords,
            Map<String, String> tabNames) throws IOException {

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle   = createDateStyle(workbook);
            CellStyle moneyStyle  = createMoneyStyle(workbook);

            // Aba Resumo — sempre presente
            createSummarySheet(workbook, headerStyle, layoutFileName,
                    remessaFileName, parsedRecords);

            // Uma aba por recordType presente no arquivo, na ordem do mapa.
            // [FIX-6] tabNames agora é LinkedHashMap → ordem garantida.
            for (Map.Entry<String, String> entry : tabNames.entrySet()) {
                String recordType = entry.getKey();
                String tabName    = entry.getValue();
                List<ParsedRecord> records = filterByType(parsedRecords, recordType);
                createRecordSheet(workbook, headerStyle, dateStyle, moneyStyle,
                        tabName, records);
            }

            // Abas para recordTypes não previstos no mapa (segmentos opcionais,
            // registros desconhecidos, etc.) — aparecem no final com nome genérico.
            Set<String> knownTypes = tabNames.keySet();
            parsedRecords.stream()
                    .map(ParsedRecord::getRecordType)
                    .distinct()
                    .filter(rt -> !knownTypes.contains(rt))
                    .sorted()
                    .forEach(rt -> {
                        List<ParsedRecord> records = filterByType(parsedRecords, rt);
                        createRecordSheet(workbook, headerStyle, dateStyle, moneyStyle,
                                "Tipo " + rt, records);
                    });

            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    // ── Sheet builders ─────────────────────────────────────────────────────

    private List<ParsedRecord> filterByType(List<ParsedRecord> records, String recordType) {
        return records.stream()
                .filter(r -> recordType.equals(r.getRecordType()))
                .toList();
    }

    private void createSummarySheet(
            Workbook workbook,
            CellStyle headerStyle,
            String layoutFileName,
            String remessaFileName,
            List<ParsedRecord> parsedRecords) {

        Sheet sheet = workbook.createSheet("Resumo");

        Map<String, Long> totalByType = parsedRecords.stream()
                .collect(Collectors.groupingBy(
                        ParsedRecord::getRecordType,
                        LinkedHashMap::new,
                        Collectors.counting()));

        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("Campo");
        titleRow.createCell(1).setCellValue("Valor");
        applyStyleToRow(titleRow, headerStyle, 2);

        Row r1 = sheet.createRow(rowNum++);
        r1.createCell(0).setCellValue("Arquivo de Layout");
        r1.createCell(1).setCellValue(layoutFileName);

        Row r2 = sheet.createRow(rowNum++);
        r2.createCell(0).setCellValue("Arquivo de Remessa");
        r2.createCell(1).setCellValue(remessaFileName);

        Row r3 = sheet.createRow(rowNum++);
        r3.createCell(0).setCellValue("Total de Linhas");
        r3.createCell(1).setCellValue(parsedRecords.size());

        rowNum++;

        Row sectionHeader = sheet.createRow(rowNum++);
        sectionHeader.createCell(0).setCellValue("Tipo de Registro");
        sectionHeader.createCell(1).setCellValue("Quantidade");
        applyStyleToRow(sectionHeader, headerStyle, 2);

        for (Map.Entry<String, Long> entry : totalByType.entrySet()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(entry.getValue());
        }

        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(new CellRangeAddress(0, rowNum - 1, 0, 1));
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void createRecordSheet(
            Workbook workbook,
            CellStyle headerStyle,
            CellStyle dateStyle,
            CellStyle moneyStyle,
            String sheetName,
            List<ParsedRecord> records) {

        // [FIX-7] Sanitiza nome da aba: remove caracteres inválidos para o Excel
        // (/ \ : ? * [ ]) antes de truncar para 31 chars.
        // Antes: nomes como "Seg A — Crédito/TED/PIX" causavam IllegalArgumentException no POI.
        String safeName = sanitizeSheetName(sheetName);

        Sheet sheet = workbook.createSheet(safeName);

        if (records == null || records.isEmpty()) {
            Row row = sheet.createRow(0);
            row.createCell(0).setCellValue("Nenhum registro encontrado");
            sheet.autoSizeColumn(0);
            return;
        }

        List<String> columns = extractColumns(records);
        int rowNum = 0;

        Row headerRow = sheet.createRow(rowNum++);
        headerRow.createCell(0).setCellValue("LINE_NUMBER");
        headerRow.createCell(1).setCellValue("RECORD_TYPE");
        headerRow.createCell(2).setCellValue("RAW_LINE");

        for (int i = 0; i < columns.size(); i++) {
            headerRow.createCell(i + 3).setCellValue(columns.get(i));
        }

        applyStyleToRow(headerRow, headerStyle, columns.size() + 3);

        for (ParsedRecord record : records) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(record.getLineNumber());
            row.createCell(1).setCellValue(record.getRecordType());
            row.createCell(2).setCellValue(record.getRawLine());

            for (int i = 0; i < columns.size(); i++) {
                String columnName = columns.get(i);
                String rawValue   = record.getFields().getOrDefault(columnName, "");
                Cell cell = row.createCell(i + 3);
                setFormattedCellValue(cell, columnName, rawValue, dateStyle, moneyStyle);
            }
        }

        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(new CellRangeAddress(0, rowNum - 1, 0, columns.size() + 2));

        int maxColumns = columns.size() + 3;
        for (int i = 0; i < maxColumns; i++) {
            sheet.autoSizeColumn(i);
            if (sheet.getColumnWidth(i) > 12000) {
                sheet.setColumnWidth(i, 12000);
            }
        }
    }

    // ── Cell formatting ────────────────────────────────────────────────────

    private void setFormattedCellValue(
            Cell cell,
            String fieldName,
            String rawValue,
            CellStyle dateStyle,
            CellStyle moneyStyle) {

        if (rawValue == null || rawValue.isBlank()) {
            cell.setCellValue("");
            return;
        }

        if (CnabFormatUtils.isDateField(fieldName)) {
            LocalDate date = CnabFormatUtils.tryParseCnabDate(rawValue);
            if (date != null) {
                cell.setCellValue(java.sql.Date.valueOf(date));
                cell.setCellStyle(dateStyle);
                return;
            }
        }

        if (CnabFormatUtils.isMoneyField(fieldName)) {
            BigDecimal money = CnabFormatUtils.tryParseCnabMoney(rawValue);
            if (money != null) {
                cell.setCellValue(money.doubleValue());
                cell.setCellStyle(moneyStyle);
                return;
            }
        }

        cell.setCellValue(rawValue);
    }

    private List<String> extractColumns(List<ParsedRecord> records) {
        LinkedHashSet<String> columns = new LinkedHashSet<>();
        for (ParsedRecord record : records) {
            columns.addAll(record.getFields().keySet());
        }
        return new ArrayList<>(columns);
    }

    // ── Utilitários ────────────────────────────────────────────────────────

    /**
     * [FIX-7] Remove caracteres inválidos para nomes de aba do Excel e trunca para 31 chars.
     *
     * Caracteres inválidos: / \ : ? * [ ]
     * Apache POI lança IllegalArgumentException se o nome da aba contiver qualquer um deles.
     */
    private static String sanitizeSheetName(String name) {
        if (name == null) return "Sem Nome";
        // Remove os caracteres proibidos pelo Excel
        String clean = name.replaceAll("[/\\\\:?*\\[\\]]", " ").strip();
        // Trunca para o limite de 31 chars do Excel
        return clean.length() > 31 ? clean.substring(0, 31) : clean;
    }

    // ── Style factories ────────────────────────────────────────────────────

    private CellStyle createHeaderStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style   = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("dd/MM/yyyy"));
        return style;
    }

    private CellStyle createMoneyStyle(Workbook workbook) {
        CellStyle style   = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        return style;
    }

    private void applyStyleToRow(Row row, CellStyle style, int totalColumns) {
        for (int i = 0; i < totalColumns; i++) {
            Cell cell = row.getCell(i);
            if (cell == null) cell = row.createCell(i);
            cell.setCellStyle(style);
        }
    }
}