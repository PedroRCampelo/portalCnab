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

import java.util.List;

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
        return cnabChatService.chat(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
            value = "/knowledge/ingest",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Void> ingestKnowledge(@ModelAttribute @Valid CnabKnowledgeIngestRequestDTO request) {
        documentIngestionService.ingestPdf(
                request.getArquivo(),
                request.getBanco(),
                request.getTipo(),
                request.getSourceType()
        );
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/knowledge/documents")
    public List<CnabKnowledgeDocumentDTO> listKnowledgeDocuments() {
        return cnabKnowledgeAdminService.listDocuments();
    }
}