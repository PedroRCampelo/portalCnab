package com.pedrocampelo.cnabportal.service.cnabaisv;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChunkingService {

    private static final int CHUNK_SIZE = 1800;
    private static final int OVERLAP = 300;

    public List<String> chunkText(String text) {
        String normalized = normalize(text);
        List<String> chunks = new ArrayList<>();

        int start = 0;
        while (start < normalized.length()) {
            int end = Math.min(start + CHUNK_SIZE, normalized.length());
            String chunk = normalized.substring(start, end).trim();

            if (!chunk.isBlank()) {
                chunks.add(chunk);
            }

            if (end == normalized.length()) {
                break;
            }

            start = Math.max(0, end - OVERLAP);
        }

        return chunks;
    }

    private String normalize(String text) {
        return text
                .replace("\u0000", "")
                .replaceAll("[\\t\\x0B\\f\\r]+", " ")
                .replaceAll(" +", " ")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }
}