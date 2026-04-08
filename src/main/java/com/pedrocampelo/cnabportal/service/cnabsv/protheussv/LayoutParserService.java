package com.pedrocampelo.cnabportal.service.cnabsv.protheussv;

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

    private static final Pattern LAYOUT_WITH_TYPE_PATTERN =
            Pattern.compile("^(.+?)(\\d{3})(\\d{3})(\\d)(.*)$");

    private static final Pattern LAYOUT_NO_TYPE_PATTERN =
            Pattern.compile("^(.+?)(\\d{3})(\\d{3})(.*)$");

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

    public List<String> findUnmatchedLines(MultipartFile layoutFile) throws IOException {
        List<String> unmatched = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(layoutFile.getInputStream(), StandardCharsets.ISO_8859_1))) {

            String line;
            while ((line = reader.readLine()) != null) {
                if (line == null || line.isBlank()) {
                    continue;
                }

                String recordType = extractRecordTypeFromOriginalLine(line);
                if (recordType == null) {
                    continue;
                }

                String sanitizedLine = sanitizeLine(line).trim();

                if (sanitizedLine.length() < 8) {
                    continue;
                }

                boolean matched = LAYOUT_WITH_TYPE_PATTERN.matcher(sanitizedLine).matches()
                        || LAYOUT_NO_TYPE_PATTERN.matcher(sanitizedLine).matches();

                if (!matched) {
                    unmatched.add(sanitizedLine);
                }
            }
        }

        return unmatched;
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

        String rawFieldName;
        int start;
        int end;
        String formatType = "";

        Matcher matcherWithType = LAYOUT_WITH_TYPE_PATTERN.matcher(sanitizedLine);
        if (matcherWithType.matches()) {
            rawFieldName = matcherWithType.group(1).trim();
            start = Integer.parseInt(matcherWithType.group(2));
            end = Integer.parseInt(matcherWithType.group(3));
            formatType = matcherWithType.group(4);
        } else {
            Matcher matcherNoType = LAYOUT_NO_TYPE_PATTERN.matcher(sanitizedLine);
            if (!matcherNoType.matches()) {
                return null;
            }

            rawFieldName = matcherNoType.group(1).trim();
            start = Integer.parseInt(matcherNoType.group(2));
            end = Integer.parseInt(matcherNoType.group(3));
        }

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
            case 1 -> "0";
            case 2 -> "1";
            case 4 -> "2";
            case 3 -> "9";
            default -> null;
        };
    }

    /*
     Solving the control character problem in layout files.
     Before: \u0001Operacao 0020020"1"
     After: Operacao 0020020"1"
     */
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