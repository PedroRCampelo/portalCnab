package com.pedrocampelo.cnabportal.cnabai.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RetrievedChunkDTO {
    private Long id;
    private String sourceName;
    private String bankCode;
    private String cnabType;
    private String segmentCode;
    private String recordType;
    private String content;
    private Double similarity;
}