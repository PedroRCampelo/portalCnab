package com.pedrocampelo.cnabportal.cnabai.controller;

import com.pedrocampelo.cnabportal.cnabai.dto.CnabChatRequestDTO;
import com.pedrocampelo.cnabportal.cnabai.dto.CnabChatResponseDTO;
import com.pedrocampelo.cnabportal.cnabai.dto.CnabKnowledgeDocumentDTO;
import com.pedrocampelo.cnabportal.cnabai.dto.CnabKnowledgeIngestRequestDTO;
import com.pedrocampelo.cnabportal.cnabai.service.CnabChatService;
import com.pedrocampelo.cnabportal.cnabai.service.CnabKnowledgeAdminService;
import com.pedrocampelo.cnabportal.cnabai.service.DocumentIngestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cnab")
@RequiredArgsConstructor
public class CnabChatController {

    private final CnabChatService cnabChatService;
    private final DocumentIngestionService documentIngestionService;
    private final CnabKnowledgeAdminService cnabKnowledgeAdminService;

    @PostMapping(
            value = "/chat",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public CnabChatResponseDTO chat(@ModelAttribute @Valid CnabChatRequestDTO request) {
        // Valida arquivo se enviado
        if (request.getArquivoCnab() != null && !request.getArquivoCnab().isEmpty()) {
            String filename = request.getArquivoCnab().getOriginalFilename() != null
                    ? request.getArquivoCnab().getOriginalFilename().toLowerCase() : "";
            if (!filename.endsWith(".txt") && !filename.endsWith(".rem")
                    && !filename.endsWith(".ret") && !filename.endsWith(".cnab")) {
                return CnabChatResponseDTO.builder()
                        .resposta("Apenas arquivos de remessa CNAB são permitidos (.txt, .rem, .ret, .cnab).")
                        .fontes(List.of())
                        .build();
            }
            if (request.getArquivoCnab().getSize() > 500 * 1024) {
                return CnabChatResponseDTO.builder()
                        .resposta("Arquivo muito grande. O limite é 500KB para arquivos de remessa.")
                        .fontes(List.of())
                        .build();
            }
        }
        return cnabChatService.chat(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
            value = "/knowledge/ingest",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> ingestKnowledge(@ModelAttribute @Valid CnabKnowledgeIngestRequestDTO request) {
        // Ingestão assíncrona — retorna imediatamente, processa em background
        documentIngestionService.ingestPdf(
                request.getArquivo(),
                request.getDescricao(),
                request.getSourceType()
        );
        return ResponseEntity.accepted().body(Map.of(
                "mensagem", "Ingestão iniciada em segundo plano. Acompanhe os logs para confirmar a conclusão.",
                "descricao", request.getDescricao()
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/knowledge/documents")
    public List<CnabKnowledgeDocumentDTO> listKnowledgeDocuments() {
        return cnabKnowledgeAdminService.listDocuments();
    }
}