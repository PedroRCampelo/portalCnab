package com.pedrocampelo.cnabportal.dto;

import java.util.List;
import java.util.Map;

public record UploadAnalysisResponseDTO(
        String layoutFileName,
        String remessaFileName,
        long layoutFileSize,
        long remessaFileSize,
        int layoutTotalLines,
        int remessaTotalLines,
        Map<String, Long> remessaTotalByType,
        List<String> layoutPreview,
        List<String> remessaPreview
) {
}