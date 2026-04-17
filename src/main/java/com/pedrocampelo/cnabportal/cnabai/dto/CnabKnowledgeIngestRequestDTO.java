package com.pedrocampelo.cnabportal.cnabai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CnabKnowledgeIngestRequestDTO {

    private MultipartFile arquivo;

    @NotBlank
    private String banco;

    @NotBlank
    private String tipo;

    private String sourceType = "PDF_LAYOUT";
}