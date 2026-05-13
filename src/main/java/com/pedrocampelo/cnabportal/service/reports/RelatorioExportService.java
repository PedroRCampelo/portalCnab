package com.pedrocampelo.cnabportal.service.reports;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.TituloRepository;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.FluxoBancoReportService;
import com.pedrocampelo.cnabportal.service.recebimentossv.RecebimentoReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RelatorioExportService {

    private final TituloRepository tituloRepository;
    private final RecebimentoReportService recebimentoReportService;
    private final FluxoBancoReportService fluxoBancoReportService;

    private static final DateTimeFormatter FMT_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final NumberFormat BRL = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
    private static final byte[] C_WHITE = rgb(255, 255, 255);
    private static final byte[] C_SURFACE = rgb(248, 250, 252);
    private static final byte[] C_SURFACE_ALT = rgb(239, 244, 248);
    private static final byte[] C_NAVY = rgb(30, 41, 59);
    private static final byte[] C_CYAN = rgb(6, 182, 212);
    private static final byte[] C_MUTED = rgb(71, 85, 105);

    // ════════════════════════════════════════════════════════════════════════
    // SEÇÃO 1 — TÍTULOS A PAGAR (Excel + PDF)
    // ════════════════════════════════════════════════════════════════════════

    @Transactional
    public byte[] gerarTitulosExcel(UUID usuarioId, String status) throws IOException {
        tituloRepository.atualizarVencidos();
        List<Titulo> titulos = buscarTitulos(usuarioId, status);
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Estilos e = criarEstilos(wb);
            XSSFSheet sheet = wb.createSheet("Títulos a Pagar");
            sheet.setDefaultColumnWidth(16);
            addTitulo(sheet, e, "Whallet · Relatório de Títulos a Pagar — " + LocalDate.now().format(FMT_DATA), 11);
            String[] cols = {"Número","Parcela","Fornecedor","Tipo","Vencimento","Valor","Saldo","Desconto","Juros","Multa","Status"};
            addCabecalho(sheet, 2, cols, e);
            int linha = 3;
            BigDecimal totalValor = BigDecimal.ZERO, totalSaldo = BigDecimal.ZERO;
            for (int i = 0; i < titulos.size(); i++) {
                Titulo t = titulos.get(i);
                Row row = sheet.createRow(linha++);
                boolean alt = i % 2 == 1;
                setTexto(row, 0, t.getNumero(), alt ? e.altStyle : null);
                setTexto(row, 1, t.getParcela(), alt ? e.altStyle : null);
                setTexto(row, 2, t.getFornecedorNome(), alt ? e.altStyle : null);
                setTexto(row, 3, t.getTipo(), alt ? e.altStyle : null);
                setCellData(row, 4, t.getVencimento(), e.dataStyle, alt ? e.altStyle : null);
                setMoeda(row, 5, t.getValor(), alt ? e.moedaAlt : e.moedaStyle);
                setMoeda(row, 6, t.getSaldo(), alt ? e.moedaAlt : e.moedaStyle);
                setMoeda(row, 7, t.getDesconto(), alt ? e.moedaAlt : e.moedaStyle);
                setMoeda(row, 8, t.getJuros(), alt ? e.moedaAlt : e.moedaStyle);
                setMoeda(row, 9, t.getMulta(), alt ? e.moedaAlt : e.moedaStyle);
                setTexto(row, 10, t.getStatus(), alt ? e.altStyle : null);
                if (t.getValor() != null) totalValor = totalValor.add(t.getValor());
                if (t.getSaldo() != null) totalSaldo = totalSaldo.add(t.getSaldo());
            }
            Row totalRow = sheet.createRow(linha + 1);
            setTexto(totalRow, 4, "TOTAL", e.totalStyle);
            setMoeda(totalRow, 5, totalValor, e.totalMoedaStyle);
            setMoeda(totalRow, 6, totalSaldo, e.totalMoedaStyle);
            sheet.autoSizeColumn(0); sheet.autoSizeColumn(1); sheet.autoSizeColumn(2); sheet.autoSizeColumn(3); sheet.autoSizeColumn(10);
            sheet.setColumnWidth(4, 3800); sheet.setColumnWidth(5, 3800); sheet.setColumnWidth(6, 3800);
            gerarAbaResumoTitulos(wb, titulos, totalValor, totalSaldo, status);
            wb.write(baos);
            return baos.toByteArray();
        }
    }

    private void gerarAbaResumoTitulos(XSSFWorkbook wb, List<Titulo> titulos, BigDecimal totalValor, BigDecimal totalSaldo, String status) {
        XSSFCellStyle ls = wb.createCellStyle(); XSSFFont lf = wb.createFont(); lf.setBold(true); lf.setColor(new XSSFColor(C_NAVY, null)); ls.setFont(lf);
        XSSFCellStyle vs = wb.createCellStyle(); XSSFFont vf = wb.createFont(); vf.setColor(new XSSFColor(C_MUTED, null)); vs.setFont(vf);
        XSSFSheet sheet = wb.createSheet("Resumo"); sheet.setColumnWidth(0, 7000); sheet.setColumnWidth(1, 5000);
        long pend = titulos.stream().filter(t -> "PENDENTE".equals(t.getStatus())).count();
        long venc = titulos.stream().filter(t -> "VENCIDO".equals(t.getStatus())).count();
        long pagos = titulos.stream().filter(t -> "PAGO".equals(t.getStatus())).count();
        BigDecimal sPend = titulos.stream().filter(t -> "PENDENTE".equals(t.getStatus())).map(Titulo::getSaldo).filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sVenc = titulos.stream().filter(t -> "VENCIDO".equals(t.getStatus())).map(Titulo::getSaldo).filter(v -> v != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        int r = 0;
        addResumoRow(sheet, r++, "Whallet · Relatório de Títulos", LocalDate.now().format(FMT_DATA), ls, vs);
        addResumoRow(sheet, r++, "Filtro de status", status == null || status.isBlank() ? "Todos" : status, ls, vs); r++;
        addResumoRow(sheet, r++, "Total de títulos", String.valueOf(titulos.size()), ls, vs);
        addResumoRow(sheet, r++, "Pendentes", pend + " — " + brl(sPend), ls, vs);
        addResumoRow(sheet, r++, "Vencidos", venc + " — " + brl(sVenc), ls, vs);
        addResumoRow(sheet, r++, "Pagos", String.valueOf(pagos), ls, vs); r++;
        addResumoRow(sheet, r++, "Valor total (face)", brl(totalValor), ls, vs);
        addResumoRow(sheet, r, "Saldo total em aberto", brl(totalSaldo), ls, vs);
    }

    @Transactional
    public byte[] gerarTitulosPdf(UUID usuarioId, String status) throws IOException {
        tituloRepository.atualizarVencidos();
        List<Titulo> titulos = buscarTitulos(usuarioId, status);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            try (Document doc = new Document(pdfDoc, PageSize.A4.rotate())) {
                doc.setMargins(30, 30, 30, 30);
                PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
                PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
                DeviceRgb ACCENT = devRgb(6,182,212), PRIMARY = devRgb(30,41,59), PMUTED = devRgb(71,85,105);
                DeviceRgb LIGHT = devRgb(248,250,252), LIGHT_ALT = devRgb(239,244,248);
                DeviceRgb DANGER = devRgb(220,38,38), WARNING = devRgb(51,65,85), SUCCESS = devRgb(34,211,238), WHITE = devRgb(255,255,255);
                Table header = new Table(new float[]{1,1}).setWidth(UnitValue.createPercentValue(100)).setMarginBottom(16);
                header.addCell(new Cell().add(new Paragraph("Whallet").setFont(bold).setFontSize(20).setFontColor(PRIMARY)).add(new Paragraph("Portal Financeiro · Relatório de Títulos a Pagar").setFont(regular).setFontSize(9).setFontColor(PMUTED)).setBorder(Border.NO_BORDER).setPadding(0));
                String fl = status == null || status.isBlank() ? "Todos os status" : status;
                header.addCell(new Cell().add(new Paragraph("Gerado em: " + LocalDate.now().format(FMT_DATA)).setFont(regular).setFontSize(9).setFontColor(PMUTED).setTextAlignment(TextAlignment.RIGHT)).add(new Paragraph("Filtro: " + fl + " · " + titulos.size() + " título(s)").setFont(regular).setFontSize(9).setFontColor(PMUTED).setTextAlignment(TextAlignment.RIGHT)).setBorder(Border.NO_BORDER).setPadding(0));
                doc.add(header);
                doc.add(new Table(1).setWidth(UnitValue.createPercentValue(100)).addCell(new Cell().setHeight(3).setBackgroundColor(ACCENT).setBorder(Border.NO_BORDER)).setMarginBottom(16));
                BigDecimal tVal = BigDecimal.ZERO, tSaldo = BigDecimal.ZERO; long pend = 0, venc = 0; BigDecimal sVenc = BigDecimal.ZERO;
                for (Titulo t : titulos) { if (t.getValor()!=null) tVal=tVal.add(t.getValor()); if (t.getSaldo()!=null) tSaldo=tSaldo.add(t.getSaldo()); if ("PENDENTE".equals(t.getStatus())) pend++; if ("VENCIDO".equals(t.getStatus())) { venc++; if (t.getSaldo()!=null) sVenc=sVenc.add(t.getSaldo()); } }
                Table kpis = new Table(new float[]{1,1,1,1}).setWidth(UnitValue.createPercentValue(100)).setMarginBottom(16);
                addPdfKpi(kpis,"Total de títulos",String.valueOf(titulos.size()),PRIMARY,bold,regular,WHITE,PRIMARY);
                addPdfKpi(kpis,"Saldo em aberto",brl(tSaldo),PRIMARY,bold,regular,LIGHT_ALT,ACCENT);
                addPdfKpi(kpis,"Vencidos",venc+" — "+brl(sVenc),DANGER,bold,regular,devRgb(254,242,242),DANGER);
                addPdfKpi(kpis,"Pendentes",String.valueOf(pend),WARNING,bold,regular,LIGHT_ALT,WARNING);
                doc.add(kpis);
                Table table = new Table(new float[]{60f,40f,140f,50f,70f,80f,80f,60f}).setWidth(UnitValue.createPercentValue(100));
                for (String h : new String[]{"Número","Parcela","Fornecedor","Tipo","Vencimento","Valor","Saldo","Status"})
                    table.addHeaderCell(new Cell().add(new Paragraph(h).setFont(bold).setFontSize(8).setFontColor(WHITE)).setBackgroundColor(PRIMARY).setBorderBottom(new SolidBorder(ACCENT,1.5f)).setBorder(Border.NO_BORDER).setPadding(5));
                for (int i = 0; i < titulos.size(); i++) {
                    Titulo t = titulos.get(i); DeviceRgb bg = i%2==0?WHITE:LIGHT;
                    DeviceRgb sc = "VENCIDO".equals(t.getStatus())?DANGER:"PAGO".equals(t.getStatus())?SUCCESS:WARNING;
                    addPdfCell(table,t.getNumero(),regular,8,PRIMARY,bg); addPdfCell(table,t.getParcela(),regular,8,PRIMARY,bg);
                    addPdfCell(table,t.getFornecedorNome(),regular,8,PRIMARY,bg); addPdfCell(table,t.getTipo(),regular,8,PRIMARY,bg);
                    addPdfCell(table,t.getVencimento()!=null?t.getVencimento().format(FMT_DATA):"—",regular,8,PRIMARY,bg);
                    addPdfCell(table,brl(t.getValor()),regular,8,PRIMARY,bg);
                    addPdfCell(table,brl(t.getSaldo()),regular,8,t.getSaldo()!=null&&t.getSaldo().compareTo(BigDecimal.ZERO)>0?DANGER:SUCCESS,bg);
                    addPdfCell(table,t.getStatus()!=null?t.getStatus():"—",bold,8,sc,bg);
                }
                doc.add(table);
                doc.add(new Table(new float[]{1}).setWidth(UnitValue.createPercentValue(100)).setMarginTop(12).addCell(new Cell().add(new Paragraph("Total valor face: "+brl(tVal)+"   |   Saldo em aberto: "+brl(tSaldo)+"   |   Gerado pelo Whallet em "+LocalDate.now().format(FMT_DATA)).setFont(regular).setFontSize(8).setFontColor(PMUTED).setTextAlignment(TextAlignment.CENTER)).setBorder(Border.NO_BORDER).setBorderTop(new SolidBorder(devRgb(203,213,225),0.5f)).setPaddingTop(8)));
            }
            return baos.toByteArray();
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // SEÇÃO 2 — RECEBIMENTOS (A RECEBER) — Excel
    // ════════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public byte[] exportarRecebimentosExcel(Usuario usuario, String tipo) throws IOException {
        Map<String, Object> dados = recebimentoReportService.relatorioCompleto(usuario);
        return switch (tipo) {
            case "aging-receber" -> gerarExcelGenerico(dados, "aging", "Aging de Receber", new String[]{"Faixa de atraso","Valor total","Quantidade"}, (item, r, e, alt) -> { setTexto(r,0,labelFaixa((String)item.get("nome")),alt?e.altStyle:null); setMoeda(r,1,toBd(item.get("total")),alt?e.moedaAlt:e.moedaStyle); setNumero(r,2,toInt(item.get("quantidade")),alt?e.altStyle:null); });
            case "por-cliente"   -> gerarPorCliente(dados);
            case "historico"     -> gerarExcelGenerico(dados, "historico", "Histórico de Pagamentos", new String[]{"Mês","Valor recebido","Quantidade"}, (item, r, e, alt) -> { setTexto(r,0,fmtMes((String)item.get("mes")),alt?e.altStyle:null); setMoeda(r,1,toBd(item.get("total")),alt?e.moedaAlt:e.moedaStyle); setNumero(r,2,toInt(item.get("quantidade")),alt?e.altStyle:null); });
            default -> throw new IllegalArgumentException("Tipo inválido: " + tipo);
        };
    }

    @SuppressWarnings("unchecked")
    private byte[] gerarPorCliente(Map<String, Object> dados) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Estilos e = criarEstilos(wb); XSSFSheet sheet = wb.createSheet("Por Cliente"); sheet.setDefaultColumnWidth(18);
            addTitulo(sheet, e, "Whallet · Top Clientes — " + LocalDate.now().format(FMT_DATA), 5);
            addCabecalho(sheet, 2, new String[]{"#","Cliente","Em aberto","Já recebido","Recebimentos"}, e);
            List<Map<String, Object>> clientes = (List<Map<String, Object>>) dados.get("porCliente");
            int row = 3; BigDecimal tAberto = BigDecimal.ZERO, tRecebido = BigDecimal.ZERO;
            for (int i = 0; i < clientes.size(); i++) {
                Map<String, Object> item = clientes.get(i); Row r = sheet.createRow(row++); boolean alt = i%2==1;
                setNumero(r,0,i+1,alt?e.altStyle:null); setTexto(r,1,(String)item.get("nome"),alt?e.altStyle:null);
                setMoeda(r,2,toBd(item.get("total")),alt?e.moedaAlt:e.moedaStyle); setMoeda(r,3,toBd(item.get("recebido")),alt?e.moedaAlt:e.moedaStyle);
                setNumero(r,4,toInt(item.get("quantidade")),alt?e.altStyle:null);
                tAberto=tAberto.add(toBd(item.get("total"))); tRecebido=tRecebido.add(toBd(item.get("recebido")));
            }
            Row tr = sheet.createRow(row+1); setTexto(tr,1,"TOTAL",e.totalStyle); setMoeda(tr,2,tAberto,e.totalMoedaStyle); setMoeda(tr,3,tRecebido,e.totalMoedaStyle);
            autoSize(sheet, 5); wb.write(out); return out.toByteArray();
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // SEÇÃO 3 — FLUXO E BANCO + DRE — Excel
    // ════════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public byte[] exportarFluxoBancoExcel(Usuario usuario, String tipo) throws IOException {
        Map<String, Object> dados = fluxoBancoReportService.relatorioCompleto(usuario);
        return switch (tipo) {
            case "fluxo-caixa"     -> gerarFluxoCaixa(dados);
            case "movimentos"      -> gerarMovimentos(dados);
            case "saldo-por-conta" -> gerarSaldoPorConta(dados);
            case "dre"             -> gerarDre(dados);
            default -> throw new IllegalArgumentException("Tipo inválido: " + tipo);
        };
    }

    @SuppressWarnings("unchecked")
    private byte[] gerarFluxoCaixa(Map<String, Object> dados) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Estilos e = criarEstilos(wb); XSSFSheet sheet = wb.createSheet("Fluxo de Caixa"); sheet.setDefaultColumnWidth(18);
            addTitulo(sheet, e, "Whallet · Fluxo de Caixa — " + LocalDate.now().format(FMT_DATA), 5);
            addCabecalho(sheet, 2, new String[]{"Mês","Entradas","Saídas","Saldo","Projetado?"}, e);
            List<Map<String, Object>> fluxo = (List<Map<String, Object>>) dados.get("fluxoCaixa");
            int row = 3;
            for (int i = 0; i < fluxo.size(); i++) {
                Map<String, Object> item = fluxo.get(i); Row r = sheet.createRow(row++); boolean alt = i%2==1;
                setTexto(r,0,fmtMes((String)item.get("mes")),alt?e.altStyle:null);
                setMoeda(r,1,toBd(item.get("entradas")),alt?e.moedaAlt:e.moedaStyle);
                setMoeda(r,2,toBd(item.get("saidas")),alt?e.moedaAlt:e.moedaStyle);
                setMoeda(r,3,toBd(item.get("saldo")),alt?e.moedaAlt:e.moedaStyle);
                setTexto(r,4,Boolean.TRUE.equals(item.get("projetado"))?"Sim":"Não",alt?e.altStyle:null);
            }
            autoSize(sheet, 5); wb.write(out); return out.toByteArray();
        }
    }

    @SuppressWarnings("unchecked")
    private byte[] gerarMovimentos(Map<String, Object> dados) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Estilos e = criarEstilos(wb); XSSFSheet sheet = wb.createSheet("Movimentos Bancários"); sheet.setDefaultColumnWidth(18);
            addTitulo(sheet, e, "Whallet · Movimentos Bancários — " + LocalDate.now().format(FMT_DATA), 6);
            addCabecalho(sheet, 2, new String[]{"Data","Tipo","Descrição","Conta","Entrada/Saída","Valor"}, e);
            List<Map<String, Object>> movs = (List<Map<String, Object>>) dados.get("movimentos");
            int row = 3;
            for (int i = 0; i < movs.size(); i++) {
                Map<String, Object> item = movs.get(i);
                if (Boolean.TRUE.equals(item.get("cancelado"))) continue;
                Row r = sheet.createRow(row++); boolean alt = i%2==1;
                setTexto(r,0,(String)item.get("data"),alt?e.altStyle:null); setTexto(r,1,(String)item.get("tipo"),alt?e.altStyle:null);
                setTexto(r,2,(String)item.get("descricao"),alt?e.altStyle:null); setTexto(r,3,(String)item.get("conta"),alt?e.altStyle:null);
                setTexto(r,4,Boolean.TRUE.equals(item.get("ehEntrada"))?"Entrada":"Saída",alt?e.altStyle:null);
                setMoeda(r,5,toBd(item.get("valor")),alt?e.moedaAlt:e.moedaStyle);
            }
            autoSize(sheet, 6); wb.write(out); return out.toByteArray();
        }
    }

    @SuppressWarnings("unchecked")
    private byte[] gerarSaldoPorConta(Map<String, Object> dados) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Estilos e = criarEstilos(wb); XSSFSheet sheet = wb.createSheet("Saldo por Conta"); sheet.setDefaultColumnWidth(18);
            addTitulo(sheet, e, "Whallet · Saldo por Conta — " + LocalDate.now().format(FMT_DATA), 5);
            addCabecalho(sheet, 2, new String[]{"Conta","Banco","Saldo inicial","Saldo atual","Principal?"}, e);
            List<Map<String, Object>> contas = (List<Map<String, Object>>) dados.get("saldoPorConta");
            int row = 3;
            for (int i = 0; i < contas.size(); i++) {
                Map<String, Object> item = contas.get(i); Row r = sheet.createRow(row++);
                boolean ehTotal = Boolean.TRUE.equals(item.get("ehTotal"));
                XSSFCellStyle txt = ehTotal?e.totalStyle:(i%2==1?e.altStyle:null);
                XSSFCellStyle moeda = ehTotal?e.totalMoedaStyle:(i%2==1?e.moedaAlt:e.moedaStyle);
                setTexto(r,0,(String)item.get("nome"),txt); setTexto(r,1,(String)item.get("banco"),txt);
                setMoeda(r,2,toBd(item.get("saldoInicial")),moeda); setMoeda(r,3,toBd(item.get("saldoAtual")),moeda);
                setTexto(r,4,Boolean.TRUE.equals(item.get("principal"))?"Sim":"",txt);
            }
            autoSize(sheet, 5); wb.write(out); return out.toByteArray();
        }
    }

    @SuppressWarnings("unchecked")
    private byte[] gerarDre(Map<String, Object> dados) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Estilos e = criarEstilos(wb); XSSFSheet sheet = wb.createSheet("DRE Mensal"); sheet.setDefaultColumnWidth(18);
            addTitulo(sheet, e, "Whallet · DRE Mensal — " + LocalDate.now().format(FMT_DATA), 5);
            addCabecalho(sheet, 2, new String[]{"Mês","Receitas","Despesas","Resultado","Margem %"}, e);
            List<Map<String, Object>> dre = (List<Map<String, Object>>) dados.get("dre");
            int row = 3;
            for (int i = 0; i < dre.size(); i++) {
                Map<String, Object> item = dre.get(i); Row r = sheet.createRow(row++);
                boolean ehTotal = Boolean.TRUE.equals(item.get("ehTotal"));
                XSSFCellStyle txt = ehTotal?e.totalStyle:(i%2==1?e.altStyle:null);
                XSSFCellStyle moeda = ehTotal?e.totalMoedaStyle:(i%2==1?e.moedaAlt:e.moedaStyle);
                String mes = (String) item.get("mes");
                setTexto(r,0,ehTotal?"TOTAL":fmtMes(mes),txt);
                setMoeda(r,1,toBd(item.get("receitas")),moeda); setMoeda(r,2,toBd(item.get("despesas")),moeda);
                setMoeda(r,3,toBd(item.get("resultado")),moeda);
                org.apache.poi.ss.usermodel.Cell pctCell = r.createCell(4);
                pctCell.setCellValue(toBd(item.get("margem")).doubleValue()/100.0);
                pctCell.setCellStyle(ehTotal?e.totalPctStyle:e.pctStyle);
            }
            autoSize(sheet, 5); wb.write(out); return out.toByteArray();
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // SEÇÃO 4 — HELPERS
    // ════════════════════════════════════════════════════════════════════════

    @FunctionalInterface
    private interface RowWriter { void write(Map<String, Object> item, Row row, Estilos e, boolean alt); }

    @SuppressWarnings("unchecked")
    private byte[] gerarExcelGenerico(Map<String, Object> dados, String chave, String nomeAba, String[] colunas, RowWriter writer) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Estilos e = criarEstilos(wb); XSSFSheet sheet = wb.createSheet(nomeAba); sheet.setDefaultColumnWidth(18);
            addTitulo(sheet, e, "Whallet · " + nomeAba + " — " + LocalDate.now().format(FMT_DATA), colunas.length);
            addCabecalho(sheet, 2, colunas, e);
            List<Map<String, Object>> lista = (List<Map<String, Object>>) dados.get(chave);
            int row = 3;
            for (int i = 0; i < lista.size(); i++) { Row r = sheet.createRow(row++); writer.write(lista.get(i), r, e, i%2==1); }
            autoSize(sheet, colunas.length); wb.write(out); return out.toByteArray();
        }
    }

    private record Estilos(XSSFCellStyle headerStyle, XSSFCellStyle moedaStyle, XSSFCellStyle moedaAlt, XSSFCellStyle altStyle, XSSFCellStyle tituloStyle, XSSFCellStyle secaoStyle, XSSFCellStyle totalStyle, XSSFCellStyle totalMoedaStyle, XSSFCellStyle pctStyle, XSSFCellStyle totalPctStyle, XSSFCellStyle dataStyle) {}

    private Estilos criarEstilos(XSSFWorkbook wb) {
        DataFormat fmt = wb.createDataFormat();
        XSSFCellStyle hs = wb.createCellStyle(); XSSFFont hf = wb.createFont(); hf.setBold(true); hf.setFontHeightInPoints((short)11); hf.setColor(new XSSFColor(C_WHITE,null)); hs.setFont(hf); hs.setFillForegroundColor(new XSSFColor(C_NAVY,null)); hs.setFillPattern(FillPatternType.SOLID_FOREGROUND); hs.setAlignment(HorizontalAlignment.CENTER); hs.setBorderBottom(BorderStyle.THIN);
        XSSFCellStyle ms = wb.createCellStyle(); ms.setDataFormat(fmt.getFormat("#,##0.00"));
        XSSFCellStyle as = wb.createCellStyle(); as.setFillForegroundColor(new XSSFColor(C_SURFACE,null)); as.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFCellStyle ma = wb.createCellStyle(); ma.cloneStyleFrom(ms); ma.setFillForegroundColor(new XSSFColor(C_SURFACE,null)); ma.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFCellStyle ts = wb.createCellStyle(); XSSFFont tf = wb.createFont(); tf.setBold(true); tf.setFontHeightInPoints((short)12); tf.setColor(new XSSFColor(C_NAVY,null)); ts.setFont(tf);
        XSSFCellStyle ss = wb.createCellStyle(); XSSFFont sf = wb.createFont(); sf.setBold(true); sf.setFontHeightInPoints((short)11); sf.setColor(new XSSFColor(C_CYAN,null)); ss.setFont(sf);
        XSSFCellStyle tts = wb.createCellStyle(); XSSFFont ttf = wb.createFont(); ttf.setBold(true); tts.setFont(ttf); tts.setFillForegroundColor(new XSSFColor(C_SURFACE_ALT,null)); tts.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFCellStyle tms = wb.createCellStyle(); tms.cloneStyleFrom(tts); tms.setDataFormat(fmt.getFormat("#,##0.00"));
        XSSFCellStyle ps = wb.createCellStyle(); ps.setDataFormat(fmt.getFormat("0.0%"));
        XSSFCellStyle tps = wb.createCellStyle(); tps.cloneStyleFrom(tts); tps.setDataFormat(fmt.getFormat("0.0%"));
        XSSFCellStyle ds = wb.createCellStyle(); ds.setDataFormat(fmt.getFormat("dd/mm/yyyy"));
        return new Estilos(hs, ms, ma, as, ts, ss, tts, tms, ps, tps, ds);
    }

    private void addTitulo(XSSFSheet sheet, Estilos e, String texto, int colspan) { Row row = sheet.createRow(0); org.apache.poi.ss.usermodel.Cell cell = row.createCell(0); cell.setCellValue(texto); cell.setCellStyle(e.tituloStyle); if (colspan>1) sheet.addMergedRegion(new CellRangeAddress(0,0,0,colspan-1)); }
    private void addCabecalho(XSSFSheet sheet, int rowNum, String[] cols, Estilos e) { Row row = sheet.createRow(rowNum); for (int i=0;i<cols.length;i++) { org.apache.poi.ss.usermodel.Cell c = row.createCell(i); c.setCellValue(cols[i]); c.setCellStyle(e.headerStyle); } }
    private void setTexto(Row row, int col, String v, XSSFCellStyle s) { org.apache.poi.ss.usermodel.Cell c = row.createCell(col); c.setCellValue(v!=null?v:""); if (s!=null) c.setCellStyle(s); }
    private void setMoeda(Row row, int col, BigDecimal v, XSSFCellStyle s) { org.apache.poi.ss.usermodel.Cell c = row.createCell(col); c.setCellValue(v!=null?v.doubleValue():0.0); if (s!=null) c.setCellStyle(s); }
    private void setNumero(Row row, int col, int v, XSSFCellStyle s) { org.apache.poi.ss.usermodel.Cell c = row.createCell(col); c.setCellValue(v); if (s!=null) c.setCellStyle(s); }
    private void setCellData(Row row, int col, LocalDate v, XSSFCellStyle ds, XSSFCellStyle fb) { org.apache.poi.ss.usermodel.Cell c = row.createCell(col); if (v!=null) { c.setCellValue(java.sql.Date.valueOf(v)); if (ds!=null) c.setCellStyle(ds); } else { c.setCellValue(""); if (fb!=null) c.setCellStyle(fb); } }
    private void addResumoRow(XSSFSheet sheet, int r, String label, String value, XSSFCellStyle ls, XSSFCellStyle vs) { Row row = sheet.createRow(r); org.apache.poi.ss.usermodel.Cell c0 = row.createCell(0); c0.setCellValue(label); c0.setCellStyle(ls); org.apache.poi.ss.usermodel.Cell c1 = row.createCell(1); c1.setCellValue(value); if (vs!=null) c1.setCellStyle(vs); }
    private void autoSize(XSSFSheet sheet, int n) { for (int i=0;i<n;i++) try { sheet.autoSizeColumn(i); } catch (Exception ignored) {} }
    private void addPdfKpi(Table t, String l, String v, DeviceRgb c, PdfFont b, PdfFont r, DeviceRgb bg, DeviceRgb bc) { t.addCell(new Cell().add(new Paragraph(l).setFont(r).setFontSize(8).setFontColor(new DeviceRgb(120,120,120))).add(new Paragraph(v).setFont(b).setFontSize(11).setFontColor(c)).setBackgroundColor(bg).setBorder(new SolidBorder(bc,0.5f)).setBorderLeft(new SolidBorder(bc,2f)).setPadding(10).setMargin(3)); }
    private void addPdfCell(Table t, String text, PdfFont f, float sz, DeviceRgb c, DeviceRgb bg) { t.addCell(new Cell().add(new Paragraph(text!=null?text:"—").setFont(f).setFontSize(sz).setFontColor(c)).setBackgroundColor(bg).setBorder(Border.NO_BORDER).setBorderBottom(new SolidBorder(devRgb(203,213,225),0.3f)).setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(5).setPaddingRight(5)); }

    private List<Titulo> buscarTitulos(UUID uid, String st) { String s = (st==null||st.isBlank())?null:st.toUpperCase(); return tituloRepository.findParaRelatorio(uid,s); }
    private String fmtMes(String m) { if (m==null) return ""; try { String[] p=m.split("-"); String[] n={"Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"}; return n[Integer.parseInt(p[1])-1]+"/"+p[0].substring(2); } catch (Exception x) { return m; } }
    private String labelFaixa(String f) { return switch(f) { case "0-30"->"Até 30 dias"; case "31-60"->"31 a 60 dias"; case "61-90"->"61 a 90 dias"; case "+90"->"Mais de 90 dias"; default->f; }; }
    private static String brl(BigDecimal v) { return v==null?"R$ 0,00":BRL.format(v); }
    private BigDecimal toBd(Object v) { if (v==null) return BigDecimal.ZERO; if (v instanceof BigDecimal bd) return bd; return new BigDecimal(v.toString()); }
    private int toInt(Object v) { if (v==null) return 0; if (v instanceof Integer i) return i; return Integer.parseInt(v.toString()); }
    private static byte[] rgb(int r, int g, int b) { return new byte[]{(byte)r,(byte)g,(byte)b}; }
    private static DeviceRgb devRgb(int r, int g, int b) { return new DeviceRgb(r,g,b); }
}