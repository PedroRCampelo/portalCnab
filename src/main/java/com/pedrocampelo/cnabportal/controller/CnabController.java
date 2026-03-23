package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.dto.UploadAnalysisResponseDTO;
import com.pedrocampelo.cnabportal.service.ExcelExportService;
import com.pedrocampelo.cnabportal.service.FileReadingService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.CrossOrigin;
import com.pedrocampelo.cnabportal.dto.ParseResponseDTO;
import com.pedrocampelo.cnabportal.dto.ParsedRecordDTO;
import com.pedrocampelo.cnabportal.service.LayoutParserService;
import com.pedrocampelo.cnabportal.service.RemessaParserService;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://portalcnab-frontend.onrender.com/"
})
@RestController
@RequestMapping("/api/cnab")
public class CnabController {

    private final FileReadingService fileReadingService;
    
    private final LayoutParserService layoutParserService;
    private final RemessaParserService remessaParserService;
    private final ExcelExportService excelExportService;

    public CnabController(FileReadingService fileReadingService, LayoutParserService layoutParserService,
                          RemessaParserService remessaParserService, ExcelExportService excelExportService) {
        this.fileReadingService = fileReadingService;
        this.layoutParserService = layoutParserService;
        this.remessaParserService = remessaParserService;
        this.excelExportService = excelExportService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadAnalysisResponseDTO analyzeFiles(
            @RequestPart("layoutFile") MultipartFile layoutFile,
            @RequestPart("remessaFile") MultipartFile remessaFile
    ) throws IOException {

        if (layoutFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de layout está vazio.");
        }

        if (remessaFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de remessa está vazio.");
        }

        List<String> layoutLines = fileReadingService.readAllLines(layoutFile);
        List<String> remessaLines = fileReadingService.readAllLines(remessaFile);

        if (layoutLines.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de layout não possui linhas válidas.");
        }

        if (remessaLines.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de remessa não possui linhas válidas.");
        }

        Map<String, Long> remessaTotalByType = fileReadingService.countRemessaByRecordType(remessaLines);

        return new UploadAnalysisResponseDTO(
                layoutFile.getOriginalFilename(),
                remessaFile.getOriginalFilename(),
                layoutFile.getSize(),
                remessaFile.getSize(),
                layoutLines.size(),
                remessaLines.size(),
                remessaTotalByType,
                fileReadingService.previewLines(layoutLines, 300),
                fileReadingService.previewLines(remessaLines, 20)
        );
    }
    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ParseResponseDTO parseFiles(
            @RequestPart("layoutFile") MultipartFile layoutFile,
            @RequestPart("remessaFile") MultipartFile remessaFile
    ) throws IOException {

        if (layoutFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de layout está vazio.");
        }

        if (remessaFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de remessa está vazio.");
        }

        var layoutFields = layoutParserService.parseLayout(layoutFile);
        var parsedRecords = remessaParserService.parseRemessa(remessaFile, layoutFields);

        Map<String, Long> totalByType = parsedRecords.stream()
                .collect(Collectors.groupingBy(
                        record -> record.getRecordType(),
                        Collectors.counting()
                ));

        List<ParsedRecordDTO> recordDTOs = parsedRecords.stream()
                .limit(200)
                .map(record -> new ParsedRecordDTO(
                        record.getLineNumber(),
                        record.getRecordType(),
                        record.getFields()
                ))
                .toList();

        return new ParseResponseDTO(
                layoutFile.getOriginalFilename(),
                remessaFile.getOriginalFilename(),
                parsedRecords.size(),
                totalByType,
                recordDTOs
        );
    }

    @PostMapping(value = "/layout/debug-clean", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<String> debugCleanLayout(@RequestPart("layoutFile") MultipartFile layoutFile) throws IOException {
        var layoutFields = layoutParserService.parseLayout(layoutFile);

        return layoutFields.stream()
                .limit(20)
                .map(field -> field.getFieldName() + " | "
                        + field.getStartPosition() + "-" + field.getEndPosition())
                .toList();
    }
    
    //Checking types
    @PostMapping(value = "/layout/debug-types", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<String> debugLayoutTypes(@RequestPart("layoutFile") MultipartFile layoutFile) throws IOException {
        var layoutFields = layoutParserService.parseLayout(layoutFile);

        return layoutFields.stream()
                .limit(200)
                .map(field -> field.getRecordType() + " | "
                        + field.getFieldName() + " | "
                        + field.getStartPosition() + "-" + field.getEndPosition())
                .toList();
    }
    
    //Debug regex
    @PostMapping(value = "/layout/debug-unmatched", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<String> debugUnmatchedLayout(@RequestPart("layoutFile") MultipartFile layoutFile) throws IOException {
        return layoutParserService.findUnmatchedLines(layoutFile);
    }

    @PostMapping(value = "/export", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> exportExcel(
            @RequestPart("layoutFile") MultipartFile layoutFile,
            @RequestPart("remessaFile") MultipartFile remessaFile
    ) throws IOException {

        if (layoutFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de layout está vazio.");
        }

        if (remessaFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de remessa está vazio.");
        }

        var layoutFields = layoutParserService.parseLayout(layoutFile);
        var parsedRecords = remessaParserService.parseRemessa(remessaFile, layoutFields);

        byte[] excelBytes = excelExportService.generateExcel(
                layoutFile.getOriginalFilename(),
                remessaFile.getOriginalFilename(),
                parsedRecords
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=cnab-export.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }
}