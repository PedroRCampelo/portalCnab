package com.pedrocampelo.cnabportal.service.gestaosv;

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
import com.pedrocampelo.cnabportal.repository.TituloRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TituloReportService {

    private final TituloRepository tituloRepository;

    private static final DateTimeFormatter FMT_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final NumberFormat BRL = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));

    // Paleta refatorada
    private static final byte[] C_WHITE = rgbBytes(255, 255, 255);       // #FFFFFF
    private static final byte[] C_SURFACE = rgbBytes(248, 250, 252);     // #F8FAFC
    private static final byte[] C_SURFACE_ALT = rgbBytes(239, 244, 248); // derivado de EFF4
    private static final byte[] C_NAVY = rgbBytes(30, 41, 59);           // #1E293B
    private static final byte[] C_SLATE = rgbBytes(51, 65, 85);          // #334155
    private static final byte[] C_CYAN = rgbBytes(6, 182, 212);          // #06B6D4
    private static final byte[] C_CYAN_SOFT = rgbBytes(34, 211, 238);    // #22D3EE
    private static final byte[] C_MUTED = rgbBytes(71, 85, 105);         // #475569
    private static final byte[] C_BORDER = rgbBytes(203, 213, 225);      // #CBD5E1

    @Transactional
    public byte[] gerarExcel(UUID usuarioId, String status) throws IOException {
        tituloRepository.atualizarVencidos();
        List<Titulo> titulos = buscarTitulos(usuarioId, status);

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            XSSFCellStyle headerStyle = wb.createCellStyle();
            XSSFFont headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setColor(new XSSFColor(C_WHITE, null));
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(new XSSFColor(C_NAVY, null));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            DataFormat fmt = wb.createDataFormat();

            XSSFCellStyle moedaStyle = wb.createCellStyle();
            moedaStyle.setDataFormat(fmt.getFormat("#,##0.00"));

            XSSFCellStyle dataStyle = wb.createCellStyle();
            dataStyle.setDataFormat(fmt.getFormat("dd/mm/yyyy"));

            XSSFCellStyle altStyle = wb.createCellStyle();
            altStyle.setFillForegroundColor(new XSSFColor(C_SURFACE, null));
            altStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            XSSFCellStyle moedaAltStyle = wb.createCellStyle();
            moedaAltStyle.cloneStyleFrom(moedaStyle);
            moedaAltStyle.setFillForegroundColor(new XSSFColor(C_SURFACE, null));
            moedaAltStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            XSSFSheet sheet = wb.createSheet("Títulos a Pagar");
            sheet.setDefaultColumnWidth(16);

            Row infoRow = sheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell infoCell = infoRow.createCell(0);
            infoCell.setCellValue("Whallet · Relatório de Títulos a Pagar — " + LocalDate.now().format(FMT_DATA));

            XSSFCellStyle infoStyle = wb.createCellStyle();
            XSSFFont infoFont = wb.createFont();
            infoFont.setBold(true);
            infoFont.setFontHeightInPoints((short) 12);
            infoFont.setColor(new XSSFColor(C_NAVY, null));
            infoStyle.setFont(infoFont);
            infoCell.setCellStyle(infoStyle);

            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));

            String[] cols = {"Número","Parcela","Fornecedor","Tipo","Vencimento","Valor","Saldo","Desconto","Juros","Multa","Status"};
            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < cols.length; i++) {
                org.apache.poi.ss.usermodel.Cell c = headerRow.createCell(i);
                c.setCellValue(cols[i]);
                c.setCellStyle(headerStyle);
            }

            int linha = 3;
            BigDecimal totalValor = BigDecimal.ZERO;
            BigDecimal totalSaldo = BigDecimal.ZERO;

            for (int i = 0; i < titulos.size(); i++) {
                Titulo t = titulos.get(i);
                Row row = sheet.createRow(linha++);
                boolean alt = i % 2 == 1;

                setCell(row, 0, t.getNumero(), alt ? altStyle : null);
                setCell(row, 1, t.getParcela(), alt ? altStyle : null);
                setCell(row, 2, t.getFornecedorNome(), alt ? altStyle : null);
                setCell(row, 3, t.getTipo(), alt ? altStyle : null);
                setCellData(row, 4, t.getVencimento(), dataStyle, alt ? altStyle : null);
                setCellMoeda(row, 5, t.getValor(), alt ? moedaAltStyle : moedaStyle);
                setCellMoeda(row, 6, t.getSaldo(), alt ? moedaAltStyle : moedaStyle);
                setCellMoeda(row, 7, t.getDesconto(), alt ? moedaAltStyle : moedaStyle);
                setCellMoeda(row, 8, t.getJuros(), alt ? moedaAltStyle : moedaStyle);
                setCellMoeda(row, 9, t.getMulta(), alt ? moedaAltStyle : moedaStyle);
                setCell(row, 10, t.getStatus(), alt ? altStyle : null);

                if (t.getValor() != null) totalValor = totalValor.add(t.getValor());
                if (t.getSaldo() != null) totalSaldo = totalSaldo.add(t.getSaldo());
            }

            Row totalRow = sheet.createRow(linha + 1);
            XSSFCellStyle totalStyle = wb.createCellStyle();
            XSSFFont totalFont = wb.createFont();
            totalFont.setBold(true);
            totalStyle.setFont(totalFont);
            totalStyle.setDataFormat(fmt.getFormat("#,##0.00"));
            totalStyle.setFillForegroundColor(new XSSFColor(C_SURFACE_ALT, null));
            totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            org.apache.poi.ss.usermodel.Cell lblTotal = totalRow.createCell(4);
            lblTotal.setCellValue("TOTAL");
            lblTotal.setCellStyle(totalStyle);

            org.apache.poi.ss.usermodel.Cell valTotal = totalRow.createCell(5);
            valTotal.setCellValue(totalValor.doubleValue());
            valTotal.setCellStyle(totalStyle);

            org.apache.poi.ss.usermodel.Cell sldTotal = totalRow.createCell(6);
            sldTotal.setCellValue(totalSaldo.doubleValue());
            sldTotal.setCellStyle(totalStyle);

            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);
            sheet.autoSizeColumn(2);
            sheet.autoSizeColumn(3);
            sheet.autoSizeColumn(10);
            sheet.setColumnWidth(4, 3800);
            sheet.setColumnWidth(5, 3800);
            sheet.setColumnWidth(6, 3800);

            XSSFSheet resumoSheet = wb.createSheet("Resumo");
            gerarAbaResumo(wb, resumoSheet, titulos, totalValor, totalSaldo, status);

            wb.write(baos);
            return baos.toByteArray();
        }
    }

    private void gerarAbaResumo(XSSFWorkbook wb, XSSFSheet sheet, List<Titulo> titulos,
                                BigDecimal totalValor, BigDecimal totalSaldo,
                                String status) {
        XSSFCellStyle labelStyle = wb.createCellStyle();
        XSSFFont lf = wb.createFont();
        lf.setBold(true);
        lf.setColor(new XSSFColor(C_NAVY, null));
        labelStyle.setFont(lf);

        XSSFCellStyle valueStyle = wb.createCellStyle();
        XSSFFont vf = wb.createFont();
        vf.setColor(new XSSFColor(C_MUTED, null));
        valueStyle.setFont(vf);

        sheet.setColumnWidth(0, 7000);
        sheet.setColumnWidth(1, 5000);

        long pendentes = titulos.stream().filter(t -> "PENDENTE".equals(t.getStatus())).count();
        long vencidos = titulos.stream().filter(t -> "VENCIDO".equals(t.getStatus())).count();
        long pagos = titulos.stream().filter(t -> "PAGO".equals(t.getStatus())).count();

        BigDecimal saldoPendente = titulos.stream()
                .filter(t -> "PENDENTE".equals(t.getStatus()))
                .map(Titulo::getSaldo)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoVencido = titulos.stream()
                .filter(t -> "VENCIDO".equals(t.getStatus()))
                .map(Titulo::getSaldo)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int r = 0;
        addResumoRow(sheet, r++, "Whallet · Relatório de Títulos", LocalDate.now().format(FMT_DATA), labelStyle, valueStyle);
        addResumoRow(sheet, r++, "Filtro de status", status == null || status.isBlank() ? "Todos" : status, labelStyle, valueStyle);
        r++;
        addResumoRow(sheet, r++, "Total de títulos", String.valueOf(titulos.size()), labelStyle, valueStyle);
        addResumoRow(sheet, r++, "Pendentes", pendentes + " — " + brl(saldoPendente), labelStyle, valueStyle);
        addResumoRow(sheet, r++, "Vencidos", vencidos + " — " + brl(saldoVencido), labelStyle, valueStyle);
        addResumoRow(sheet, r++, "Pagos", String.valueOf(pagos), labelStyle, valueStyle);
        r++;
        addResumoRow(sheet, r++, "Valor total (face)", brl(totalValor), labelStyle, valueStyle);
        addResumoRow(sheet, r, "Saldo total em aberto", brl(totalSaldo), labelStyle, valueStyle);
    }

    private void addResumoRow(XSSFSheet sheet, int rowNum, String label, String value,
                              XSSFCellStyle labelStyle, XSSFCellStyle valueStyle) {
        Row row = sheet.createRow(rowNum);

        org.apache.poi.ss.usermodel.Cell c0 = row.createCell(0);
        c0.setCellValue(label);
        c0.setCellStyle(labelStyle);

        org.apache.poi.ss.usermodel.Cell c1 = row.createCell(1);
        c1.setCellValue(value);
        if (valueStyle != null) {
            c1.setCellStyle(valueStyle);
        }
    }

    @Transactional
    public byte[] gerarPdf(UUID usuarioId, String status) throws IOException {
        tituloRepository.atualizarVencidos();
        List<Titulo> titulos = buscarTitulos(usuarioId, status);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);

            try (Document doc = new Document(pdfDoc, PageSize.A4.rotate())) {
                doc.setMargins(30, 30, 30, 30);

                PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
                PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

                DeviceRgb ACCENT = rgb(6, 182, 212);
                DeviceRgb PRIMARY = rgb(30, 41, 59);
                DeviceRgb MUTED = rgb(71, 85, 105);
                DeviceRgb LIGHT = rgb(248, 250, 252);
                DeviceRgb LIGHT_ALT = rgb(239, 244, 248);
                DeviceRgb DANGER = rgb(220, 38, 38);
                DeviceRgb WARNING = rgb(51, 65, 85);
                DeviceRgb SUCCESS = rgb(34, 211, 238);
                DeviceRgb WHITE = rgb(255, 255, 255);

                Table header = new Table(new float[]{1, 1});
                header.setWidth(UnitValue.createPercentValue(100));
                header.setMarginBottom(16);

                Cell brandCell = new Cell()
                        .add(new Paragraph("Whallet").setFont(bold).setFontSize(20).setFontColor(PRIMARY))
                        .add(new Paragraph("Portal Financeiro · Relatório de Títulos a Pagar")
                                .setFont(regular).setFontSize(9).setFontColor(MUTED))
                        .setBorder(Border.NO_BORDER)
                        .setPadding(0);

                String filtroLabel = status == null || status.isBlank() ? "Todos os status" : status;
                Cell infoCell = new Cell()
                        .add(new Paragraph("Gerado em: " + LocalDate.now().format(FMT_DATA))
                                .setFont(regular).setFontSize(9).setFontColor(MUTED).setTextAlignment(TextAlignment.RIGHT))
                        .add(new Paragraph("Filtro: " + filtroLabel + " · " + titulos.size() + " título(s)")
                                .setFont(regular).setFontSize(9).setFontColor(MUTED).setTextAlignment(TextAlignment.RIGHT))
                        .setBorder(Border.NO_BORDER)
                        .setPadding(0);

                header.addCell(brandCell);
                header.addCell(infoCell);
                doc.add(header);

                doc.add(new Table(1)
                        .setWidth(UnitValue.createPercentValue(100))
                        .addCell(new Cell()
                                .setHeight(3)
                                .setBackgroundColor(ACCENT)
                                .setBorder(Border.NO_BORDER))
                        .setMarginBottom(16));

                BigDecimal totalValor = BigDecimal.ZERO;
                BigDecimal totalSaldo = BigDecimal.ZERO;
                long pendentes = 0;
                long vencidos = 0;
                BigDecimal saldoVencido = BigDecimal.ZERO;

                for (Titulo t : titulos) {
                    if (t.getValor() != null) totalValor = totalValor.add(t.getValor());
                    if (t.getSaldo() != null) totalSaldo = totalSaldo.add(t.getSaldo());
                    if ("PENDENTE".equals(t.getStatus())) pendentes++;
                    if ("VENCIDO".equals(t.getStatus())) {
                        vencidos++;
                        if (t.getSaldo() != null) saldoVencido = saldoVencido.add(t.getSaldo());
                    }
                }

                Table kpis = new Table(new float[]{1, 1, 1, 1})
                        .setWidth(UnitValue.createPercentValue(100))
                        .setMarginBottom(16);

                addKpi(kpis, "Total de títulos", String.valueOf(titulos.size()), PRIMARY, bold, regular, WHITE, PRIMARY);
                addKpi(kpis, "Saldo em aberto", brl(totalSaldo), PRIMARY, bold, regular, LIGHT_ALT, ACCENT);
                addKpi(kpis, "Vencidos", vencidos + " — " + brl(saldoVencido), DANGER, bold, regular, rgb(254, 242, 242), DANGER);
                addKpi(kpis, "Pendentes", String.valueOf(pendentes), WARNING, bold, regular, LIGHT_ALT, WARNING);
                doc.add(kpis);

                float[] colWidths = {60f, 40f, 140f, 50f, 70f, 80f, 80f, 60f};
                Table table = new Table(colWidths).setWidth(UnitValue.createPercentValue(100));

                String[] headers = {"Número","Parcela","Fornecedor","Tipo","Vencimento","Valor","Saldo","Status"};
                for (String h : headers) {
                    table.addHeaderCell(
                            new Cell()
                                    .add(new Paragraph(h).setFont(bold).setFontSize(8).setFontColor(WHITE))
                                    .setBackgroundColor(PRIMARY)
                                    .setBorderBottom(new SolidBorder(ACCENT, 1.5f))
                                    .setBorder(Border.NO_BORDER)
                                    .setPadding(5)
                    );
                }

                for (int i = 0; i < titulos.size(); i++) {
                    Titulo t = titulos.get(i);
                    DeviceRgb rowBg = i % 2 == 0 ? WHITE : LIGHT;
                    DeviceRgb statusCor = "VENCIDO".equals(t.getStatus()) ? DANGER
                            : "PAGO".equals(t.getStatus()) ? SUCCESS
                            : WARNING;

                    addCell(table, t.getNumero(), regular, 8, PRIMARY, rowBg);
                    addCell(table, t.getParcela(), regular, 8, PRIMARY, rowBg);
                    addCell(table, t.getFornecedorNome(), regular, 8, PRIMARY, rowBg);
                    addCell(table, t.getTipo(), regular, 8, PRIMARY, rowBg);
                    addCell(table, t.getVencimento() != null ? t.getVencimento().format(FMT_DATA) : "—", regular, 8, PRIMARY, rowBg);
                    addCell(table, brl(t.getValor()), regular, 8, PRIMARY, rowBg);
                    addCell(table, brl(t.getSaldo()), regular, 8,
                            t.getSaldo() != null && t.getSaldo().compareTo(BigDecimal.ZERO) > 0 ? DANGER : SUCCESS, rowBg);
                    addCell(table, t.getStatus() != null ? t.getStatus() : "—", bold, 8, statusCor, rowBg);
                }

                doc.add(table);

                doc.add(new Table(new float[]{1})
                        .setWidth(UnitValue.createPercentValue(100))
                        .setMarginTop(12)
                        .addCell(new Cell()
                                .add(new Paragraph(
                                        "Total valor face: " + brl(totalValor) + "   |   " +
                                                "Saldo em aberto: " + brl(totalSaldo) + "   |   " +
                                                "Gerado pelo Whallet em " + LocalDate.now().format(FMT_DATA))
                                        .setFont(regular)
                                        .setFontSize(8)
                                        .setFontColor(MUTED)
                                        .setTextAlignment(TextAlignment.CENTER))
                                .setBorder(Border.NO_BORDER)
                                .setBorderTop(new SolidBorder(rgb(203, 213, 225), 0.5f))
                                .setPaddingTop(8)));
            }

            return baos.toByteArray();
        }
    }

    private List<Titulo> buscarTitulos(UUID usuarioId, String status) {
        String s = (status == null || status.isBlank()) ? null : status.toUpperCase();
        return tituloRepository.findParaRelatorio(usuarioId, s);
    }

    private static String brl(BigDecimal v) {
        return v == null ? "R$ 0,00" : BRL.format(v);
    }

    private static DeviceRgb rgb(int r, int g, int b) {
        return new DeviceRgb(r, g, b);
    }

    private static byte[] rgbBytes(int r, int g, int b) {
        return new byte[]{(byte) r, (byte) g, (byte) b};
    }

    private void setCell(Row row, int col, String value, XSSFCellStyle style) {
        org.apache.poi.ss.usermodel.Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        if (style != null) c.setCellStyle(style);
    }

    private void setCellMoeda(Row row, int col, BigDecimal value, XSSFCellStyle style) {
        org.apache.poi.ss.usermodel.Cell c = row.createCell(col);
        c.setCellValue(value != null ? value.doubleValue() : 0.0);
        if (style != null) c.setCellStyle(style);
    }

    private void setCellData(Row row, int col, LocalDate value, XSSFCellStyle dataStyle, XSSFCellStyle fallbackTextStyle) {
        org.apache.poi.ss.usermodel.Cell c = row.createCell(col);
        if (value != null) {
            c.setCellValue(java.sql.Date.valueOf(value));
            if (dataStyle != null) c.setCellStyle(dataStyle);
        } else {
            c.setCellValue("");
            if (fallbackTextStyle != null) c.setCellStyle(fallbackTextStyle);
        }
    }

    private void addKpi(Table table, String label, String valor, DeviceRgb cor,
                        PdfFont bold, PdfFont regular, DeviceRgb bg, DeviceRgb borderColor) {
        table.addCell(
                new Cell()
                        .add(new Paragraph(label).setFont(regular).setFontSize(8).setFontColor(new DeviceRgb(120, 120, 120)))
                        .add(new Paragraph(valor).setFont(bold).setFontSize(11).setFontColor(cor))
                        .setBackgroundColor(bg)
                        .setBorder(new SolidBorder(borderColor, 0.5f))
                        .setBorderLeft(new SolidBorder(borderColor, 2f))
                        .setPadding(10)
                        .setMargin(3)
        );
    }

    private void addCell(Table table, String text, PdfFont font, float size,
                         DeviceRgb color, DeviceRgb bg) {
        table.addCell(
                new Cell()
                        .add(new Paragraph(text != null ? text : "—").setFont(font).setFontSize(size).setFontColor(color))
                        .setBackgroundColor(bg)
                        .setBorder(Border.NO_BORDER)
                        .setBorderBottom(new SolidBorder(rgb(203, 213, 225), 0.3f))
                        .setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(5).setPaddingRight(5)
        );
    }
}