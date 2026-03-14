package com.pedrocampelo.cnabportal.dto;

import java.util.Map;

public record ParsedRecordDTO(
        int lineNumber,
        String recordType,
        Map<String, String> fields
) {
}