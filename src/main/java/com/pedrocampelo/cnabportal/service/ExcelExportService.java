package com.pedrocampelo.cnabportal.service;

import com.pedrocampelo.cnabportal.model.ParsedRecord;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExcelExportService {

    public byte[] generateExcel(String layoutFileName, String remessaFileName, List<ParsedRecord> parsedRecords) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            createSummarySheet(workbook, layoutFileName, remessaFileName, parsedRecords);
            createRecordSheet(workbook, "Header", filterByType(parsedRecords, "0"));
            createRecordSheet(workbook, "Detalhe", filterByType(parsedRecords, "1"));
            createRecordSheet(workbook, "Complemento", filterByType(parsedRecords, "2"));
            createRecordSheet(workbook, "Trailer", filterByType(parsedRecords, "9"));

            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private List<ParsedRecord> filterByType(List<ParsedRecord> parsedRecords, String recordType) {
        return parsedRecords.stream()
                .filter(record -> recordType.equals(record.getRecordType()))
                .toList();
    }

    private void createSummarySheet(Workbook workbook, String layoutFileName, String remessaFileName, List<ParsedRecord> parsedRecords) {
        Sheet sheet = workbook.createSheet("Resumo");

        Map<String, Long> totalByType = parsedRecords.stream()
                .collect(Collectors.groupingBy(
                        ParsedRecord::getRecordType,
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        int rowNum = 0;

        Row row0 = sheet.createRow(rowNum++);
        row0.createCell(0).setCellValue("Arquivo de Layout");
        row0.createCell(1).setCellValue(layoutFileName);

        Row row1 = sheet.createRow(rowNum++);
        row1.createCell(0).setCellValue("Arquivo de Remessa");
        row1.createCell(1).setCellValue(remessaFileName);

        Row row2 = sheet.createRow(rowNum++);
        row2.createCell(0).setCellValue("Total de Linhas");
        row2.createCell(1).setCellValue(parsedRecords.size());

        rowNum++;

        Row header = sheet.createRow(rowNum++);
        header.createCell(0).setCellValue("Tipo de Registro");
        header.createCell(1).setCellValue("Quantidade");

        for (Map.Entry<String, Long> entry : totalByType.entrySet()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(entry.getValue());
        }

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void createRecordSheet(Workbook workbook, String sheetName, List<ParsedRecord> records) {
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

        for (int i = 0; i < columns.size(); i++) {
            headerRow.createCell(i + 2).setCellValue(columns.get(i));
        }

        for (ParsedRecord record : records) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(record.getLineNumber());
            row.createCell(1).setCellValue(record.getRecordType());

            for (int i = 0; i < columns.size(); i++) {
                String columnName = columns.get(i);
                String value = record.getFields().getOrDefault(columnName, "");
                row.createCell(i + 2).setCellValue(value);
            }
        }

        for (int i = 0; i < columns.size() + 2; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private List<String> extractColumns(List<ParsedRecord> records) {
        LinkedHashSet<String> columns = new LinkedHashSet<>();

        for (ParsedRecord record : records) {
            columns.addAll(record.getFields().keySet());
        }

        return new ArrayList<>(columns);
    }
}