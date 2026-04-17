package com.pedrocampelo.cnabportal.cnabai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CnabChatRequestDTO {

    @NotBlank
    private String pergunta;

    private String banco;
    private String tipo;
    private Boolean usarArquivoAtualComoContexto = false;
    private MultipartFile arquivoCnab;
}