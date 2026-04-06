package com.pedrocampelo.cnabportal.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import com.pedrocampelo.cnabportal.dto.CnabReportData;
import com.pedrocampelo.cnabportal.dto.CnabReportData.Alerta;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Gera o relatório PDF analítico do arquivo CNAB.
 * Nova identidade visual:
 * - Fundo branco
 * - Texto preto/cinza escuro
 * - Destaques em amarelo/dourado
 */
@Service
public class PdfReportService {

    // ── Nova paleta ─────────────────────────────────────────────────────────
    private static final DeviceRgb BG_PAGE         = rgb(255, 255, 255); // branco
    private static final DeviceRgb BG_LIGHT        = rgb(245, 245, 240); // off-white
    private static final DeviceRgb BG_CARD         = rgb(250, 250, 248); // cards claros
    private static final DeviceRgb BG_CARD_ALT     = rgb(255, 251, 235); // leve tom dourado
    private static final DeviceRgb BORDER_LIGHT    = rgb(229, 229, 229);
    private static final DeviceRgb BORDER_DARK     = rgb(210, 210, 210);

    private static final DeviceRgb GOLD            = rgb(245, 158, 11);  // #F59E0B
    private static final DeviceRgb GOLD_SOFT       = rgb(252, 211, 77);  // dourado claro
    private static final DeviceRgb GOLD_DARK       = rgb(217, 119, 6);

    private static final DeviceRgb TEXT_MAIN       = rgb(17, 17, 17);    // preto principal
    private static final DeviceRgb TEXT_SECONDARY  = rgb(55, 55, 55);
    private static final DeviceRgb TEXT_MUTED      = rgb(120, 120, 120);
    private static final DeviceRgb TEXT_DIM        = rgb(145, 145, 145);

    private static final DeviceRgb SUCCESS         = rgb(22, 163, 74);
    private static final DeviceRgb ERROR           = rgb(220, 38, 38);
    private static final DeviceRgb WARNING         = rgb(245, 158, 11);
    private static final DeviceRgb INFO_COLOR      = rgb(202, 138, 4);

    private static final DeviceRgb ERROR_BG        = rgb(254, 242, 242);
    private static final DeviceRgb WARN_BG         = rgb(255, 251, 235);
    private static final DeviceRgb INFO_BG         = rgb(254, 249, 195);
    private static final DeviceRgb SUCCESS_BG      = rgb(240, 253, 244);

    private static final NumberFormat BRL = NumberFormat.getCurrencyInstance(new Locale("pt","BR"));
    private static final float MARGIN = 40f;

    public byte[] generate(CnabReportData data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);

        pdf.addEventHandler(PdfDocumentEvent.START_PAGE, new LightBackgroundHandler());

        Document doc = new Document(pdf, PageSize.A4);
        doc.setMargins(MARGIN, MARGIN, MARGIN, MARGIN);

        PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

        buildCapa(doc, bold, regular, data);

        doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

        sectionTitle(doc, bold, "Resumo Executivo");
        doc.add(sub(regular, "Análise completa de " + data.totalLinhas() +
                " linhas · " + data.tipoArquivo() + " · " + data.modalidade()));
        buildKpis(doc, bold, regular, data);

        if (!data.contagemPorTipo().isEmpty()) {
            sectionTitle(doc, bold, "Distribuição por Segmento");
            buildDistribuicao(doc, bold, regular, data);
        }

        if (!data.titulosPorMes().isEmpty()) {
            sectionTitle(doc, bold, "Distribuição Mensal");
            buildTimeline(doc, bold, regular, data);
        }

        sectionTitle(doc, bold, "Análise e Alertas");
        buildAlertas(doc, bold, regular, data);

        if (data.topFavorecidos() != null && !data.topFavorecidos().isEmpty()) {
            String tit = "COBRANÇA".equalsIgnoreCase(data.modalidade())
                    ? "Top Sacados / Pagadores" : "Top Favorecidos";
            sectionTitle(doc, bold, tit);
            buildTopFavorecidos(doc, bold, regular, data);
        }

        buildRodape(doc, regular, data);

        doc.close();
        return baos.toByteArray();
    }

    // ──────────────────────────────────────────────────────────────────────
    // EVENT HANDLER — fundo claro em todas as páginas
    // ──────────────────────────────────────────────────────────────────────

    private static class LightBackgroundHandler implements IEventHandler {
        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdfDoc = docEvent.getDocument();
            PdfPage page = docEvent.getPage();
            PdfCanvas canvas = new PdfCanvas(page);
            Rectangle rect = page.getPageSize();

            canvas.setFillColor(BG_PAGE)
                    .rectangle(rect.getLeft(), rect.getBottom(), rect.getWidth(), rect.getHeight())
                    .fill();

            // barra dourada superior na capa
            if (pdfDoc.getPageNumber(page) == 1) {
                canvas.setFillColor(GOLD)
                        .rectangle(rect.getLeft(), rect.getTop() - 6, rect.getWidth(), 6)
                        .fill();
            }

            canvas.release();
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // CAPA
    // ──────────────────────────────────────────────────────────────────────

    private void buildCapa(Document doc,
                           PdfFont bold, PdfFont regular, CnabReportData data) throws IOException {

        doc.add(blankLine(24));

        try (InputStream is = getClass().getResourceAsStream("/static/logo.png")) {
            if (is == null) {
                try (InputStream is2 = getClass().getResourceAsStream("/logo.png")) {
                    if (is2 != null) {
                        doc.add(new Image(ImageDataFactory.create(is2.readAllBytes()))
                                .setWidth(64).setHeight(64).setMarginBottom(24));
                    }
                }
            } else {
                doc.add(new Image(ImageDataFactory.create(is.readAllBytes()))
                        .setWidth(64).setHeight(64).setMarginBottom(24));
            }
        } catch (Exception ignored) {}

        doc.add(new Paragraph("Whallet")
                .setFont(bold)
                .setFontSize(32)
                .setFontColor(TEXT_MAIN)
                .setMarginBottom(4));

        doc.add(new Paragraph("Portal CNAB")
                .setFont(regular)
                .setFontSize(13)
                .setFontColor(TEXT_MUTED)
                .setMarginBottom(36));

        doc.add(hRule(GOLD, 2, 24));

        String modalidadeLabel = "PAGAMENTO".equalsIgnoreCase(data.modalidade())
                ? "Pagamentos" : "Recebimentos";

        doc.add(new Paragraph("Relatório de " + modalidadeLabel + " CNAB")
                .setFont(bold)
                .setFontSize(28)
                .setFontColor(TEXT_MAIN)
                .setMarginTop(24)
                .setMarginBottom(8));

        doc.add(new Paragraph(data.tipoArquivo() + "  ·  " + data.nomeBanco())
                .setFont(regular)
                .setFontSize(14)
                .setFontColor(GOLD_DARK)
                .setMarginBottom(40));

        Table meta = new Table(new float[]{2, 3})
                .setWidth(UnitValue.createPercentValue(80))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(48);

        addMetaRow(meta, bold, regular, "Empresa", data.nomeEmpresa());
        addMetaRow(meta, bold, regular, "CNPJ", fmtCnpj(data.cnpjEmpresa()));
        addMetaRow(meta, bold, regular, "Arquivo", data.nomeArquivo());
        addMetaRow(meta, bold, regular, "Gerado em", fmtDate(data.dataGeracao()));
        addMetaRow(meta, bold, regular, "Relatório em", fmtDate(data.dataRelatorio()));

        doc.add(meta);

        doc.add(hRule(BORDER_LIGHT, 1, 0));
        doc.add(new Paragraph("Gerado automaticamente pelo Whallet · Portal CNAB")
                .setFont(regular)
                .setFontSize(10)
                .setFontColor(TEXT_DIM)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(12));
    }

    // ──────────────────────────────────────────────────────────────────────
    // KPI GRID
    // ──────────────────────────────────────────────────────────────────────

    private void buildKpis(Document doc, PdfFont bold, PdfFont regular, CnabReportData data) {
        Table grid = new Table(new float[]{1, 1})
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(28);

        addKpi(grid, bold, regular, "Valor Total da Remessa", BRL.format(data.valorTotal()), GOLD);
        addKpi(grid, bold, regular, "Quantidade de Títulos", String.valueOf(data.totalTitulos()), TEXT_MAIN);
        addKpi(grid, bold, regular, "Total de Lotes", String.valueOf(data.totalLotes()), GOLD_SOFT);
        addKpi(grid, bold, regular, "Valor Médio por Título", BRL.format(data.valorMedio()), SUCCESS);
        addKpi(grid, bold, regular, "Maior Título", BRL.format(data.maiorValor()), WARNING);
        addKpi(grid, bold, regular, "Menor Título", BRL.format(data.menorValor()), INFO_COLOR);

        doc.add(grid);
    }

    private void addKpi(Table grid, PdfFont bold, PdfFont regular,
                        String label, String value, DeviceRgb accent) {
        Cell card = new Cell()
                .setBackgroundColor(BG_CARD)
                .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                .setBorderLeft(new SolidBorder(accent, 4))
                .setPadding(16)
                .setMargin(4);

        card.add(new Paragraph(label)
                .setFont(regular)
                .setFontSize(10)
                .setFontColor(TEXT_MUTED)
                .setMarginBottom(6));

        card.add(new Paragraph(value)
                .setFont(bold)
                .setFontSize(17)
                .setFontColor(TEXT_MAIN)
                .setMargin(0));

        grid.addCell(card);
    }

    // ──────────────────────────────────────────────────────────────────────
    // DISTRIBUIÇÃO POR SEGMENTO
    // ──────────────────────────────────────────────────────────────────────

    private void buildDistribuicao(Document doc, PdfFont bold, PdfFont regular, CnabReportData data) {
        Table table = new Table(new float[]{3, 2, 3, 2})
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(28);

        for (String h : new String[]{"Segmento", "Qtd", "Valor Total", "% do total"}) {
            table.addHeaderCell(new Cell()
                    .setBackgroundColor(BG_LIGHT)
                    .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                    .setPadding(10)
                    .add(new Paragraph(h)
                            .setFont(bold)
                            .setFontSize(10)
                            .setFontColor(TEXT_SECONDARY)));
        }

        long totalQtd = data.contagemPorTipo().values().stream().mapToLong(l -> l).sum();

        for (Map.Entry<String, Long> e : data.contagemPorTipo().entrySet()) {
            String seg = e.getKey();
            long qtd = e.getValue();
            BigDecimal val = data.valorPorTipo().getOrDefault(seg, BigDecimal.ZERO);
            float pct = totalQtd > 0 ? (qtd * 100f / totalQtd) : 0;

            table.addCell(td(regular, nomeSegmento(seg)));
            table.addCell(td(regular, String.valueOf(qtd)));
            table.addCell(td(regular, BRL.format(val)));
            table.addCell(td(regular, String.format("%.1f%%", pct)).setFontColor(GOLD_DARK));
        }

        doc.add(table);
    }

    // ──────────────────────────────────────────────────────────────────────
    // LINHA DO TEMPO MENSAL
    // ──────────────────────────────────────────────────────────────────────

    private void buildTimeline(Document doc, PdfFont bold, PdfFont regular, CnabReportData data) {
        Table table = new Table(new float[]{3, 2, 3})
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(28);

        for (String h : new String[]{"Mês/Ano", "Títulos", "Valor Total"}) {
            table.addHeaderCell(new Cell()
                    .setBackgroundColor(BG_LIGHT)
                    .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                    .setPadding(10)
                    .add(new Paragraph(h)
                            .setFont(bold)
                            .setFontSize(10)
                            .setFontColor(TEXT_SECONDARY)));
        }

        for (Map.Entry<String, Integer> e : data.titulosPorMes().entrySet()) {
            String mesKey = e.getKey();
            int qtd = e.getValue();
            BigDecimal val = data.valorPorMes().getOrDefault(mesKey, BigDecimal.ZERO);

            table.addCell(td(regular, fmtMes(mesKey)));
            table.addCell(td(regular, String.valueOf(qtd)));
            table.addCell(td(regular, BRL.format(val)));
        }

        doc.add(table);
    }

    // ──────────────────────────────────────────────────────────────────────
    // ALERTAS
    // ──────────────────────────────────────────────────────────────────────

    private void buildAlertas(Document doc, PdfFont bold, PdfFont regular, CnabReportData data) {
        List<Alerta> alertas = data.alertas();

        if (alertas.isEmpty()) {
            doc.add(new Paragraph("✓  Nenhum alerta encontrado — arquivo aparenta estar consistente.")
                    .setFont(regular)
                    .setFontSize(11)
                    .setFontColor(SUCCESS)
                    .setBackgroundColor(SUCCESS_BG)
                    .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                    .setPadding(12)
                    .setMarginBottom(28));
            return;
        }

        long nCrit = alertas.stream().filter(a -> a.severidade() == CnabReportData.Severidade.CRITICO).count();
        long nAtenc = alertas.stream().filter(a -> a.severidade() == CnabReportData.Severidade.ATENCAO).count();
        long nInfo = alertas.stream().filter(a -> a.severidade() == CnabReportData.Severidade.INFO).count();

        doc.add(new Paragraph(
                nCrit + " crítico(s)   ·   " + nAtenc + " atenção   ·   " + nInfo + " informativo(s)")
                .setFont(regular)
                .setFontSize(11)
                .setFontColor(TEXT_MUTED)
                .setMarginBottom(16));

        for (Alerta a : alertas) {
            DeviceRgb cor = corSeveridade(a.severidade());
            DeviceRgb fundo = fundoSeveridade(a.severidade());
            String badge = badgeSeveridade(a.severidade());

            Table card = new Table(new float[]{1})
                    .setWidth(UnitValue.createPercentValue(100))
                    .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                    .setBorderLeft(new SolidBorder(cor, 4))
                    .setBackgroundColor(fundo)
                    .setMarginBottom(10);

            Cell inner = new Cell().setBorder(Border.NO_BORDER).setPadding(14);

            inner.add(new Paragraph(badge + "  —  " + a.categoria())
                    .setFont(bold)
                    .setFontSize(10)
                    .setFontColor(cor)
                    .setMarginBottom(4));

            inner.add(new Paragraph(a.descricao())
                    .setFont(bold)
                    .setFontSize(12)
                    .setFontColor(TEXT_MAIN)
                    .setMarginBottom(4));

            if (a.quantidade() > 0) {
                inner.add(new Paragraph(a.quantidade() + " ocorrência(s)   ·   " + a.detalhe())
                        .setFont(regular)
                        .setFontSize(10)
                        .setFontColor(TEXT_SECONDARY));
            } else if (a.detalhe() != null && !a.detalhe().isBlank()) {
                inner.add(new Paragraph(a.detalhe())
                        .setFont(regular)
                        .setFontSize(10)
                        .setFontColor(TEXT_SECONDARY));
            }

            card.addCell(inner);
            doc.add(card);
        }

        doc.add(blankLine(16));
    }

    // ──────────────────────────────────────────────────────────────────────
    // TOP FAVORECIDOS
    // ──────────────────────────────────────────────────────────────────────

    private void buildTopFavorecidos(Document doc, PdfFont bold, PdfFont regular, CnabReportData data) {
        Table table = new Table(new float[]{1, 8})
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER)
                .setMarginBottom(28);

        int rank = 1;
        for (String nome : data.topFavorecidos()) {
            boolean even = (rank % 2 == 0);
            DeviceRgb bg = even ? BG_LIGHT : BG_CARD;

            table.addCell(new Cell()
                    .setBackgroundColor(bg)
                    .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                    .setPadding(10)
                    .add(new Paragraph(String.format("%02d", rank))
                            .setFont(bold)
                            .setFontSize(12)
                            .setFontColor(GOLD_DARK)));

            table.addCell(new Cell()
                    .setBackgroundColor(bg)
                    .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                    .setPadding(10)
                    .add(new Paragraph(nome)
                            .setFont(regular)
                            .setFontSize(11)
                            .setFontColor(TEXT_MAIN)));
            rank++;
        }

        doc.add(table);
    }

    // ──────────────────────────────────────────────────────────────────────
    // RODAPÉ
    // ──────────────────────────────────────────────────────────────────────

    private void buildRodape(Document doc, PdfFont regular, CnabReportData data) {
        doc.add(hRule(BORDER_LIGHT, 1, 32));
        doc.add(new Paragraph(
                "Relatório gerado pelo Whallet · Portal CNAB  ·  " +
                        fmtDate(data.dataRelatorio()) + "  ·  " +
                        data.totalLinhas() + " linhas processadas")
                .setFont(regular)
                .setFontSize(9)
                .setFontColor(TEXT_DIM)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(10));
    }

    // ──────────────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────────────

    private void sectionTitle(Document doc, PdfFont bold, String title) {
        doc.add(new Paragraph(title)
                .setFont(bold)
                .setFontSize(16)
                .setFontColor(TEXT_MAIN)
                .setMarginTop(24)
                .setMarginBottom(12)
                .setBorderBottom(new SolidBorder(GOLD, 2))
                .setPaddingBottom(6));
    }

    private Paragraph sub(PdfFont regular, String text) {
        return new Paragraph(text)
                .setFont(regular)
                .setFontSize(11)
                .setFontColor(TEXT_MUTED)
                .setMarginBottom(18);
    }

    private void addMetaRow(Table t, PdfFont bold, PdfFont regular, String label, String value) {
        t.addCell(new Cell()
                .setBackgroundColor(BG_LIGHT)
                .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                .setPadding(10)
                .add(new Paragraph(label)
                        .setFont(bold)
                        .setFontSize(10)
                        .setFontColor(TEXT_SECONDARY)));

        t.addCell(new Cell()
                .setBackgroundColor(BG_CARD)
                .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                .setPadding(10)
                .add(new Paragraph(value == null || value.isBlank() ? "—" : value)
                        .setFont(regular)
                        .setFontSize(10)
                        .setFontColor(TEXT_MAIN)));
    }

    private Cell td(PdfFont regular, String text) {
        return new Cell()
                .setBorder(new SolidBorder(BORDER_LIGHT, 1))
                .setPadding(10)
                .add(new Paragraph(text)
                        .setFont(regular)
                        .setFontSize(11)
                        .setFontColor(TEXT_MAIN));
    }

    private Table hRule(DeviceRgb color, float height, float marginTop) {
        return new Table(new float[]{1})
                .setWidth(UnitValue.createPercentValue(100))
                .setHeight(height)
                .setBackgroundColor(color)
                .setBorder(Border.NO_BORDER)
                .setMarginTop(marginTop)
                .setMarginBottom(0);
    }

    private Paragraph blankLine(float height) {
        return new Paragraph(" ").setFontSize(1).setMarginBottom(height);
    }

    private DeviceRgb corSeveridade(CnabReportData.Severidade s) {
        return switch (s) {
            case CRITICO -> ERROR;
            case ATENCAO -> WARNING;
            case INFO -> INFO_COLOR;
        };
    }

    private DeviceRgb fundoSeveridade(CnabReportData.Severidade s) {
        return switch (s) {
            case CRITICO -> ERROR_BG;
            case ATENCAO -> WARN_BG;
            case INFO -> INFO_BG;
        };
    }

    private String badgeSeveridade(CnabReportData.Severidade s) {
        return switch (s) {
            case CRITICO -> "CRITICO";
            case ATENCAO -> "ATENCAO";
            case INFO -> "INFO";
        };
    }

    private String nomeSegmento(String tipo) {
        return switch (tipo) {
            case "0"  -> "Header Arquivo";
            case "1"  -> "Detalhe (CNAB 400)";
            case "3A" -> "Seg A - Cred/TED/PIX";
            case "3B" -> "Seg B - Compl PIX/Endereco";
            case "3J" -> "Seg J - Boletos";
            case "3O" -> "Seg O - Concessionarias";
            case "3N" -> "Seg N - Tributos";
            case "3P" -> "Seg P - Titulo";
            case "3Q" -> "Seg Q - Pagador";
            case "3W" -> "Seg W - FGTS";
            case "5"  -> "Trailer Lote";
            case "9"  -> "Trailer Arquivo";
            default   -> tipo;
        };
    }

    private String fmtMes(String raw) {
        try {
            String[] p = raw.split("-");
            String[] m = {"Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"};
            return m[Integer.parseInt(p[1]) - 1] + "/" + p[0];
        } catch (Exception e) {
            return raw;
        }
    }

    private String fmtDate(String d) {
        return (d == null || d.isBlank()) ? "—" : d;
    }

    private String fmtCnpj(String raw) {
        if (raw == null) return "—";
        String d = raw.replaceAll("\\D","");
        if (d.length() == 14) {
            return d.replaceAll("(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{2})", "$1.$2.$3/$4-$5");
        }
        return raw.isBlank() ? "—" : raw;
    }

    private static DeviceRgb rgb(int r, int g, int b) {
        return new DeviceRgb(r / 255f, g / 255f, b / 255f);
    }
}