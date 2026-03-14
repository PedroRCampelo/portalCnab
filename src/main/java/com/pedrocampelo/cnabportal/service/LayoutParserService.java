package com.pedrocampelo.cnabportal.service;

import com.pedrocampelo.cnabportal.model.LayoutField;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LayoutParserService {

    /**
     * Exemplo de linha sanitizada:
     * T. de Registro 0010010"0"
     * Operacao       0020020"1"
     * Literal Remessa003009 "REMESSA"
     *
     * Padrão:
     * [nome do campo][pos ini 3][pos fim 3][tipo 1][resto]
     */
    private static final Pattern LAYOUT_LINE_PATTERN =
            Pattern.compile("^(.+?)(\\d{3})(\\d{3})(\\d)(.*)$");

    public List<LayoutField> parseLayout(MultipartFile layoutFile) throws IOException {
        List<LayoutField> fields = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(layoutFile.getInputStream(), StandardCharsets.ISO_8859_1))) {

            String line;
            while ((line = reader.readLine()) != null) {
                LayoutField field = parseLayoutLine(line);
                if (field != null) {
                    fields.add(field);
                }
            }
        }

        return fields;
    }

    private LayoutField parseLayoutLine(String line) {
        if (line == null || line.isBlank()) {
            return null;
        }

        String recordType = extractRecordTypeFromOriginalLine(line);
        if (recordType == null) {
            return null;
        }

        String sanitizedLine = sanitizeLine(line).trim();

        if (sanitizedLine.length() < 8) {
            return null;
        }

        Matcher matcher = LAYOUT_LINE_PATTERN.matcher(sanitizedLine);
        if (!matcher.matches()) {
            return null;
        }

        String rawFieldName = matcher.group(1).trim();
        int start = Integer.parseInt(matcher.group(2));
        int end = Integer.parseInt(matcher.group(3));
        String formatType = matcher.group(4);

        if (end < start) {
            return null;
        }

        String fieldName = normalizeFieldName(rawFieldName);

        LayoutField field = new LayoutField();
        field.setRecordType(recordType);
        field.setFieldName(fieldName);
        field.setStartPosition(start);
        field.setEndPosition(end);
        field.setLength((end - start) + 1);
        field.setFormatType(formatType);
        field.setRawConfigLine(line);

        return field;
    }

    private String extractRecordTypeFromOriginalLine(String line) {
        if (line == null || line.isEmpty()) {
            return null;
        }

        char firstChar = line.charAt(0);

        return switch (firstChar) {
            case 1 -> "0"; // header
            case 2 -> "1"; // detalhe
            case 4 -> "2"; // complemento
            case 3 -> "9"; // trailer
            default -> null;
        };
    }

    /*
     * Solving the control character problem in layout files.
     * Before: \u0001Operacao 0020020"1"
     * After: Operacao 0020020"1"
     * */
    private String sanitizeLine(String line) {
        if (line == null || line.isBlank()) {
            return line;
        }

        char firstChar = line.charAt(0);

        if (Character.isISOControl(firstChar)) {
            return line.substring(1);
        }

        return line;
    }

    private String normalizeFieldName(String fieldName) {
        return fieldName
                .replaceAll("\\s+", "_")
                .replaceAll("[^a-zA-Z0-9_]", "")
                .replaceAll("_+", "_")
                .replaceAll("^_+|_+$", "")
                .toUpperCase();
    }
}