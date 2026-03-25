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

    public byte[] generateExcel(String layoutFileName, String remessaFileName, List<ParsedRecord> parsedRecords) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle moneyStyle = createMoneyStyle(workbook);

            createSummarySheet(workbook, headerStyle, layoutFileName, remessaFileName, parsedRecords);
            createRecordSheet(workbook, headerStyle, dateStyle, moneyStyle, "Header", filterByType(parsedRecords, "0"));
            createRecordSheet(workbook, headerStyle, dateStyle, moneyStyle, "Detalhe", filterByType(parsedRecords, "1"));
            createRecordSheet(workbook, headerStyle, dateStyle, moneyStyle, "Complemento", filterByType(parsedRecords, "2"));
            createRecordSheet(workbook, headerStyle, dateStyle, moneyStyle, "Trailer", filterByType(parsedRecords, "9"));

            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private List<ParsedRecord> filterByType(List<ParsedRecord> parsedRecords, String recordType) {
        return parsedRecords.stream()
                .filter(record -> recordType.equals(record.getRecordType()))
                .toList();
    }

    private void createSummarySheet(Workbook workbook, CellStyle headerStyle, String layoutFileName, String remessaFileName, List<ParsedRecord> parsedRecords) {
        Sheet sheet = workbook.createSheet("Resumo");

        Map<String, Long> totalByType = parsedRecords.stream()
                .collect(Collectors.groupingBy(
                        ParsedRecord::getRecordType,
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("Campo");
        titleRow.createCell(1).setCellValue("Valor");
        applyStyleToRow(titleRow, headerStyle, 2);

        Row row1 = sheet.createRow(rowNum++);
        row1.createCell(0).setCellValue("Arquivo de Layout");
        row1.createCell(1).setCellValue(layoutFileName);

        Row row2 = sheet.createRow(rowNum++);
        row2.createCell(0).setCellValue("Arquivo de Remessa");
        row2.createCell(1).setCellValue(remessaFileName);

        Row row3 = sheet.createRow(rowNum++);
        row3.createCell(0).setCellValue("Total de Linhas");
        row3.createCell(1).setCellValue(parsedRecords.size());

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
            List<ParsedRecord> records
    ) {
        Sheet sheet = workbook.createSheet(sheetName);

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
                String rawValue = record.getFields().getOrDefault(columnName, "");

                Cell cell = row.createCell(i + 3);
                setFormattedCellValue(cell, columnName, rawValue, dateStyle, moneyStyle);
            }
        }

        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(new CellRangeAddress(0, rowNum - 1, 0, columns.size() + 2));

        int maxColumns = columns.size() + 3;
        for (int i = 0; i < maxColumns; i++) {
            sheet.autoSizeColumn(i);

            int currentWidth = sheet.getColumnWidth(i);
            int maxWidth = 12000;

            if (currentWidth > maxWidth) {
                sheet.setColumnWidth(i, maxWidth);
            }
        }
    }

    private void setFormattedCellValue(
            Cell cell,
            String fieldName,
            String rawValue,
            CellStyle dateStyle,
            CellStyle moneyStyle
    ) {
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
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("dd/MM/yyyy"));
        return style;
    }

    private CellStyle createMoneyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        return style;
    }

    private void applyStyleToRow(Row row, CellStyle style, int totalColumns) {
        for (int i = 0; i < totalColumns; i++) {
            Cell cell = row.getCell(i);
            if (cell == null) {
                cell = row.createCell(i);
            }
            cell.setCellStyle(style);
        }
    }
}