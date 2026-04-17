package com.pedrocampelo.cnabportal.cnabai.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CnabKnowledgeDocumentDTO {
    private String sourceName;
    private String bankCode;
    private String cnabType;
    private String sourceType;
    private Long totalChunks;
    private LocalDateTime lastIngestionAt;
}