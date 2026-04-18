package com.pedrocampelo.cnabportal.cnabai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CnabKnowledgeIngestRequestDTO {

    private MultipartFile arquivo;

    /**
     * Descrição livre do documento — ex: "Sicredi 240 pagamento", "Bradesco retorno 400".
     * Banco e tipo são inferidos automaticamente a partir desta descrição.
     * Não há obrigatoriedade de nomenclatura específica.
     */
    @NotBlank(message = "Informe uma descrição para identificar o documento, ex: 'Itaú 240 pagamento'")
    private String descricao;

    private String sourceType = "PDF_LAYOUT";
}