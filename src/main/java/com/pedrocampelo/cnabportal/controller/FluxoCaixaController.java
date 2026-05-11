package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite;
import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaudeMesResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.FluxoCaixaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.FluxoBancoReportService;
import java.util.Map;
import com.pedrocampelo.cnabportal.service.reports.RelatorioExportService;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/fluxo-caixa")
@RequireWhalletPlusWrite
@RequiredArgsConstructor
@Slf4j
public class FluxoCaixaController {

    private final FluxoCaixaService fluxoCaixaService;
    private final FluxoBancoReportService fluxoBancoReportService;
    private final RelatorioExportService relatorioExportService;

    /**
     * GET /api/fluxo-caixa/saude-mes
     *
     * Retorna o estado de saúde financeira do mês atual:
     *   - Saldo atual (calculado via movimentos)
     *   - A receber esse mês
     *   - A pagar esse mês
     *   - Sobra ou falta projetada
     *   - Alerta preditivo (se saldo for ficar negativo nos próximos 60 dias)
     */
    @GetMapping("/saude-mes")
    public ResponseEntity<SaudeMesResponse> saudeMes(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(fluxoCaixaService.calcularSaudeMes(usuario));
    }

    /**
     * GET /api/fluxo-caixa/relatorio
     * Relatório unificado: fluxo de caixa, movimentos, saldo por conta, DRE.
     */
    @GetMapping("/relatorio")
    public ResponseEntity<Map<String, Object>> relatorio(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(fluxoBancoReportService.relatorioCompleto(usuario));
    }

    // ── GET /api/fluxo-caixa/exportar/excel?tipo=fluxo-caixa|movimentos|saldo-por-conta|dre
    @GetMapping("/exportar/excel")
    public ResponseEntity<byte[]> exportarExcel(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam String tipo) {
        try {
            byte[] bytes = relatorioExportService.exportarFluxoBancoExcel(usuario, tipo);
            String filename = tipo + "_" + java.time.LocalDate.now() + ".xlsx";
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(bytes);
        } catch (Exception e) {
            log.error("Erro ao exportar fluxo/banco ({}): {}", tipo, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}