package com.pedrocampelo.cnabportal.dto;

import java.util.List;
import java.util.Map;

public record ParseResponseDTO(
        String layoutFileName,
        String remessaFileName,
        int totalLines,
        Map<String, Long> totalByType,
        List<ParsedRecordDTO> records
) {
}