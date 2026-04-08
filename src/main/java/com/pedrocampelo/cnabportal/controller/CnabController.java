package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.AnonymousUsageTracker;
import com.pedrocampelo.cnabportal.dto.CnabReportData;
import com.pedrocampelo.cnabportal.dto.UploadAnalysisResponseDTO;
import com.pedrocampelo.cnabportal.layout.BankLayout;
import com.pedrocampelo.cnabportal.model.ParsedRecord;
import com.pedrocampelo.cnabportal.model.Remessa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.RemessaRepository;
import com.pedrocampelo.cnabportal.service.*;
import com.pedrocampelo.cnabportal.service.cnabsv.reportsv.CnabAnalysisService;
import com.pedrocampelo.cnabportal.service.cnabsv.CnabParserFactory;
import com.pedrocampelo.cnabportal.service.stripesv.CotaService;
import com.pedrocampelo.cnabportal.service.cnabsv.ExcelExportService;
import com.pedrocampelo.cnabportal.service.cnabsv.FileReadingService;
import com.pedrocampelo.cnabportal.service.cnabsv.reportsv.PdfReportService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.pedrocampelo.cnabportal.dto.ParseResponseDTO;
import com.pedrocampelo.cnabportal.dto.ParsedRecordDTO;
import com.pedrocampelo.cnabportal.service.cnabsv.protheussv.LayoutParserService;
import com.pedrocampelo.cnabportal.service.cnabsv.protheussv.RemessaParserService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://whallet.com.br",
        "https://www.whallet.com.br"
})

@RestController
@RequestMapping("/api/cnab")
public class CnabController {

    private final FileReadingService    fileReadingService;
    private final LayoutParserService   layoutParserService;
    private final RemessaParserService  remessaParserService;
    private final ExcelExportService    excelExportService;
    private final CnabParserFactory     cnabParserFactory;
    private final CnabAnalysisService   cnabAnalysisService;
    private final PdfReportService      pdfReportService;
    private final CotaService           cotaService;
    private final RemessaRepository     remessaRepository;
    private final AnonymousUsageTracker anonymousTracker;

    public CnabController(
            FileReadingService    fileReadingService,
            LayoutParserService   layoutParserService,
            RemessaParserService  remessaParserService,
            ExcelExportService    excelExportService,
            CnabParserFactory     cnabParserFactory,
            CnabAnalysisService   cnabAnalysisService,
            PdfReportService      pdfReportService,
            CotaService           cotaService,
            RemessaRepository     remessaRepository,
            AnonymousUsageTracker anonymousTracker) {
        this.fileReadingService   = fileReadingService;
        this.layoutParserService  = layoutParserService;
        this.remessaParserService = remessaParserService;
        this.excelExportService   = excelExportService;
        this.cnabParserFactory    = cnabParserFactory;
        this.cnabAnalysisService  = cnabAnalysisService;
        this.pdfReportService     = pdfReportService;
        this.cotaService          = cotaService;
        this.remessaRepository    = remessaRepository;
        this.anonymousTracker     = anonymousTracker;
    }

    // ── Endpoints existentes (Modo Protheus) — sem alteração ───────────────

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadAnalysisResponseDTO analyzeFiles(
            @RequestPart("layoutFile") MultipartFile layoutFile,
            @RequestPart("remessaFile") MultipartFile remessaFile
    ) throws IOException {

        if (layoutFile.isEmpty())  throw new IllegalArgumentException("O arquivo de layout está vazio.");
        if (remessaFile.isEmpty()) throw new IllegalArgumentException("O arquivo de remessa está vazio.");

        List<String> layoutLines  = fileReadingService.readAllLines(layoutFile);
        List<String> remessaLines = fileReadingService.readAllLines(remessaFile);

        if (layoutLines.isEmpty())  throw new IllegalArgumentException("O arquivo de layout não possui linhas válidas.");
        if (remessaLines.isEmpty()) throw new IllegalArgumentException("O arquivo de remessa não possui linhas válidas.");

        Map<String, Long> remessaTotalByType =
                fileReadingService.countRemessaByRecordType(remessaLines);

        return new com.pedrocampelo.cnabportal.dto.UploadAnalysisResponseDTO(
                layoutFile.getOriginalFilename(),
                remessaFile.getOriginalFilename(),
                layoutFile.getSize(),
                remessaFile.getSize(),
                layoutLines.size(),
                remessaLines.size(),
                remessaTotalByType,
                fileReadingService.previewLines(layoutLines, 300),
                fileReadingService.previewLines(remessaLines, 20));
    }

    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ParseResponseDTO parseFiles(
            @RequestPart("layoutFile") MultipartFile layoutFile,
            @RequestPart("remessaFile") MultipartFile remessaFile
    ) throws IOException {

        if (layoutFile.isEmpty())  throw new IllegalArgumentException("O arquivo de layout está vazio.");
        if (remessaFile.isEmpty()) throw new IllegalArgumentException("O arquivo de remessa está vazio.");

        var layoutFields   = layoutParserService.parseLayout(layoutFile);
        var parsedRecords  = remessaParserService.parseRemessa(remessaFile, layoutFields);

        Map<String, Long> totalByType = parsedRecords.stream()
                .collect(Collectors.groupingBy(ParsedRecord::getRecordType, Collectors.counting()));

        List<ParsedRecordDTO> recordDTOs = parsedRecords.stream()
                .limit(200)
                .map(r -> new ParsedRecordDTO(r.getLineNumber(), r.getRecordType(), r.getFields()))
                .toList();

        return new ParseResponseDTO(
                layoutFile.getOriginalFilename(),
                remessaFile.getOriginalFilename(),
                parsedRecords.size(),
                totalByType,
                recordDTOs);
    }

    @PostMapping(value = "/layout/debug-clean", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<String> debugCleanLayout(@RequestPart("layoutFile") MultipartFile layoutFile)
            throws IOException {
        return layoutParserService.parseLayout(layoutFile).stream()
                .limit(20)
                .map(f -> f.getFieldName() + " | " + f.getStartPosition() + "-" + f.getEndPosition())
                .toList();
    }

    @PostMapping(value = "/layout/debug-types", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<String> debugLayoutTypes(@RequestPart("layoutFile") MultipartFile layoutFile)
            throws IOException {
        return layoutParserService.parseLayout(layoutFile).stream()
                .limit(200)
                .map(f -> f.getRecordType() + " | " + f.getFieldName() + " | "
                        + f.getStartPosition() + "-" + f.getEndPosition())
                .toList();
    }

    @PostMapping(value = "/layout/debug-unmatched", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<String> debugUnmatchedLayout(@RequestPart("layoutFile") MultipartFile layoutFile)
            throws IOException {
        return layoutParserService.findUnmatchedLines(layoutFile);
    }

    @PostMapping(value = "/export", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> exportExcel(
            @RequestPart("layoutFile")  MultipartFile layoutFile,
            @RequestPart("remessaFile") MultipartFile remessaFile,
            @RequestParam("cnabType")   String cnabType
    ) throws IOException {

        if (layoutFile.isEmpty())  throw new IllegalArgumentException("O arquivo de layout está vazio.");
        if (remessaFile.isEmpty()) throw new IllegalArgumentException("O arquivo de remessa está vazio.");

        System.out.println("CNAB TYPE RECEBIDO: " + cnabType);

        List<ParsedRecord> parsedRecords = "240".equals(cnabType)
                ? parse240(layoutFile, remessaFile)
                : parse400(layoutFile, remessaFile);

        byte[] excelBytes = excelExportService.generateExcel(
                layoutFile.getOriginalFilename(),
                remessaFile.getOriginalFilename(),
                parsedRecords);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=cnab-export.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    private List<ParsedRecord> parse400(MultipartFile layoutFile, MultipartFile remessaFile)
            throws IOException {
        var layoutFields = layoutParserService.parseLayout(layoutFile);
        return remessaParserService.parseRemessa(remessaFile, layoutFields);
    }

    private List<ParsedRecord> parse240(MultipartFile layoutFile, MultipartFile remessaFile)
            throws IOException {
        System.out.println("Entrou no fluxo CNAB 240");
        return new ArrayList<>();
    }

    // ── Novo endpoint — Modo Bancário ──────────────────────────────────────

    /**
     * Exporta um arquivo CNAB bancário para Excel sem precisar de arquivo de layout.
     *
     * Parâmetros obrigatórios:
     *   bank    → código do banco    (ex.: "ITAU")
     *   version → versão CNAB        (ex.: "400" | "240")
     *   mode    → modalidade         (ex.: "COBRANCA" | "PAGAMENTO")
     *
     * Combinações suportadas atualmente:
     *   ITAU + 400 + COBRANCA   → Itaú CNAB 400 Cobrança (remessa/retorno)
     *   ITAU + 240 + PAGAMENTO  → Itaú CNAB 240 Pagamento SISPAG (remessa/retorno)
     */
    @PostMapping(value = "/export-bank", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> exportExcelBank(
            @RequestPart("remessaFile")  MultipartFile remessaFile,
            @RequestParam("bank")        String bank,
            @RequestParam("version")     String version,
            @RequestParam("mode")        String mode,
            @AuthenticationPrincipal     Usuario usuario,
            HttpServletRequest           request
    ) throws IOException {

        if (remessaFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de remessa está vazio.");
        }

        // Verifica cota — autenticado ou anônimo
        if (usuario == null) {
            String ip = obterIp(request);
            if (!anonymousTracker.registrarUso(ip)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .header("X-Limite-Anonimo", "true")
                        .build();
            }
        } else {
            if (!cotaService.temCotaDisponivel(usuario)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
            }
        }

        BankLayout layout = BankLayout.of(bank, version, mode);
        CnabParser parser = cnabParserFactory.getParser(layout);
        List<ParsedRecord> parsedRecords = parser.parse(remessaFile);

        Map<String, String> tabNames = resolveTabNames(layout);

        String layoutLabel = bank + " CNAB " + version + " " + mode + " (embutido)";
        byte[] excelBytes  = excelExportService.generateExcel(
                layoutLabel,
                remessaFile.getOriginalFilename(),
                parsedRecords,
                tabNames);

        // Registra histórico apenas para usuários autenticados
        if (usuario != null) {
            cotaService.registrarUso(usuario);
            remessaRepository.save(Remessa.builder()
                    .usuario(usuario)
                    .empresa(usuario.getEmpresa())
                    .nomeArquivo(remessaFile.getOriginalFilename())
                    .banco(bank).versao(version).modo(mode)
                    .tipoSaida("EXCEL")
                    .qtdRegistros(parsedRecords.size())
                    .build());
        }

        String outputName = remessaFile.getOriginalFilename()
                .replaceAll("[^a-zA-Z0-9._-]", "_") + "_resultado.xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + outputName)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    // ── Endpoint PDF ──────────────────────────────────────────────────────────

    /**
     * Gera um relatório PDF analítico do arquivo CNAB bancário.
     * Mesmos parâmetros do /export-bank:  bank, version, mode.
     *
     * Seções do relatório:
     *   1. Capa — logo, tipo, empresa, data
     *   2. Resumo executivo — valor total, qtd títulos, médias
     *   3. Distribuição por segmento — barras de proporção
     *   4. Linha do tempo mensal — vencimentos/pagamentos por mês
     *   5. Análise e alertas — 9 categorias com severidade
     *   6. Top favorecidos/pagadores
     */
    @PostMapping(value = "/report-bank", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> reportPdfBank(
            @RequestPart("remessaFile")  MultipartFile remessaFile,
            @RequestParam("bank")        String bank,
            @RequestParam("version")     String version,
            @RequestParam("mode")        String mode,
            @AuthenticationPrincipal     Usuario usuario,
            HttpServletRequest           request
    ) throws IOException {

        if (remessaFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de remessa está vazio.");
        }

        // Verifica cota — autenticado ou anônimo
        if (usuario == null) {
            String ip = obterIp(request);
            if (!anonymousTracker.registrarUso(ip)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .header("X-Limite-Anonimo", "true")
                        .build();
            }
        } else {
            if (!cotaService.temCotaDisponivel(usuario)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
            }
        }

        BankLayout layout = BankLayout.of(bank, version, mode);
        CnabParser parser = cnabParserFactory.getParser(layout);
        List<ParsedRecord> parsedRecords = parser.parse(remessaFile);

        CnabReportData reportData = cnabAnalysisService.analyze(
                parsedRecords,
                remessaFile.getOriginalFilename(),
                mode.toUpperCase(),
                bank + " CNAB " + version
        );

        byte[] pdfBytes = pdfReportService.generate(reportData);

        if (usuario != null) {
            cotaService.registrarUso(usuario);
            remessaRepository.save(Remessa.builder()
                    .usuario(usuario)
                    .empresa(usuario.getEmpresa())
                    .nomeArquivo(remessaFile.getOriginalFilename())
                    .banco(bank).versao(version).modo(mode)
                    .tipoSaida("PDF")
                    .qtdRegistros(parsedRecords.size())
                    .valorTotal(reportData.valorTotal())
                    .build());
        }

        String outputName = remessaFile.getOriginalFilename()
                .replaceAll("[^a-zA-Z0-9._-]", "_") + "_relatorio.pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + outputName)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * Retorna o mapa de recordType → nome de aba adequado para cada layout.
     * Permite que o ExcelExportService crie abas com nomes semânticos.
     */
    private Map<String, String> resolveTabNames(BankLayout layout) {
        return switch (layout) {
            case ITAU_400_COBRANCA -> Map.of(
                    "0", "Header",
                    "1", "Detalhe",
                    "2", "Complemento",
                    "9", "Trailer"
            );
            case ITAU_240_COBRANCA -> Map.of(
                    "0",  "Header Arquivo",
                    "1",  "Header Lote",
                    "3P", "Seg P — Título",
                    "3Q", "Seg Q — Pagador",
                    "5",  "Trailer Lote",
                    "9",  "Trailer Arquivo"
            );
            case ITAU_240_PAGAMENTO -> Map.of(
                    "0",  "Header Arquivo",
                    "1",  "Header Lote",
                    "3A", "Seg A — Créd TED PIX",
                    "3J", "Seg J — Boletos",
                    "3O", "Seg O — Concessionárias",
                    "3N", "Seg N — Tributos",
                    "5",  "Trailer Lote",
                    "9",  "Trailer Arquivo"
            );
            case BRADESCO_240_PAGAMENTO -> Map.of(
                    "0",  "Header Arquivo",
                    "1",  "Header Lote",
                    "3A", "Seg A — Créd Cheque OP",
                    "3J", "Seg J — Boletos",
                    "3O", "Seg O — Tributos Contas",
                    "5",  "Trailer Lote",
                    "9",  "Trailer Arquivo"
            );
            case BRADESCO_400_COBRANCA -> Map.of(
                    "0", "Header",
                    "1", "Transacao — Boleto",
                    "2", "Mensagem",
                    "3", "Rateio Credito",
                    "9", "Trailer"
            );
            case BB_240_PAGAMENTO -> Map.of(
                    "0",  "Header Arquivo",
                    "1",  "Header Lote",
                    "3A", "Seg A — Créd TED PIX",
                    "3B", "Seg B — Compl PIX Endereço",
                    "3J", "Seg J — Boletos",
                    "3O", "Seg O — Contas Tributos CB",
                    "3N", "Seg N — Tributos s CB",
                    "5",  "Trailer Lote",
                    "9",  "Trailer Arquivo"
            );
            case CAIXA_240_PAGAMENTO -> Map.of(
                    "0",  "Header Arquivo",
                    "1",  "Header Lote",
                    "3A", "Seg A — Créd TED DOC OP",
                    "3B", "Seg B — Compl Endereço",
                    "3J", "Seg J — Boletos",
                    "3O", "Seg O — Concessionárias",
                    "3N", "Seg N — Tributos s CB",
                    "3W", "Seg W — FGTS",
                    "5",  "Trailer Lote",
                    "9",  "Trailer Arquivo"
            );
        };
    }

    // Consulta usos anônimos restantes — frontend usa para mostrar o banner
    @GetMapping("/anonimo/usos")
    public ResponseEntity<Map<String, Object>> usosAnonimos(HttpServletRequest request) {
        String ip = obterIp(request);
        return ResponseEntity.ok(Map.of(
                "usados",    anonymousTracker.usosRealizados(ip),
                "restantes", anonymousTracker.usosRestantes(ip),
                "limite",    2
        ));
    }

    private String obterIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}