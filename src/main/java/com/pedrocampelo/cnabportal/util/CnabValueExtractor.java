package com.pedrocampelo.cnabportal.util;

public class CnabValueExtractor {

    private CnabValueExtractor() {
    }

    public static String extract(String line, int startPosition, int endPosition) {
        if (line == null || line.isEmpty()) {
            return "";
        }

        int startIndex = Math.max(0, startPosition - 1);
        int endIndex = Math.min(line.length(), endPosition);

        if (startIndex >= endIndex) {
            return "";
        }

        return line.substring(startIndex, endIndex).trim();
    }
}