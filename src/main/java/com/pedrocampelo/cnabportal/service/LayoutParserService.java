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

    private static final Pattern POSITION_PATTERN = Pattern.compile("(\\d{1,3})\\D+(\\d{1,3})");

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

        String trimmed = line.trim();

        if (trimmed.length() < 8) {
            return null;
        }

        Matcher matcher = POSITION_PATTERN.matcher(trimmed);
        if (!matcher.find()) {
            return null;
        }

        int start = Integer.parseInt(matcher.group(1));
        int end = Integer.parseInt(matcher.group(2));

        if (end < start) {
            return null;
        }

        String recordType = extractRecordType(trimmed);
        String fieldName = extractFieldName(trimmed, matcher.start());

        if (fieldName.isBlank()) {
            fieldName = "CAMPO_" + start + "_" + end;
        }

        return new LayoutField(
                recordType,
                normalizeFieldName(fieldName),
                start,
                end,
                (end - start) + 1,
                line
        );
    }

    private String extractRecordType(String line) {
        char firstChar = line.charAt(0);

        if (Character.isDigit(firstChar)) {
            return String.valueOf(firstChar);
        }

        return "UNKNOWN";
    }

    private String extractFieldName(String line, int positionStartIndex) {
        String beforePosition = line.substring(0, positionStartIndex).trim();

        return beforePosition
                .replaceAll("^\\d+\\s*", "")
                .trim();
    }

    private String normalizeFieldName(String fieldName) {
        return fieldName
                .replaceAll("\\s+", "_")
                .replaceAll("[^A-ZA-Z0-9_]", "")
                .toUpperCase();
    }
    
}