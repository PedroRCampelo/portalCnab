package com.pedrocampelo.cnabportal.cnabai.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CnabChatResponseDTO {
    private String resposta;
    private List<RetrievedChunkDTO> fontes;
}