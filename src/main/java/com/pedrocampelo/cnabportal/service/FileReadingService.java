package com.pedrocampelo.cnabportal.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FileReadingService {

    public List<String> readAllLines(MultipartFile file) throws IOException {
        List<String> lines = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.ISO_8859_1))) {

            String line;
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        }

        return lines;
    }

    public Map<String, Long> countRemessaByRecordType(List<String> remessaLines) {
        return remessaLines.stream()
                .filter(line -> line != null && !line.isBlank())
                .map(line -> String.valueOf(line.charAt(0)))
                .collect(Collectors.groupingBy(type -> type, LinkedHashMap::new, Collectors.counting()));
    }

    public List<String> previewLines(List<String> lines, int limit) {
        return lines.stream()
                .limit(limit)
                .toList();
    }
}