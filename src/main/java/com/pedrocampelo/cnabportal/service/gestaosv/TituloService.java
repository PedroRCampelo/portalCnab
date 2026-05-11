package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.model.MovimentoBancario;
import com.pedrocampelo.cnabportal.model.SaldoBancario;
import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.TituloRepository;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.MovimentoBancarioService;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.SaldoBancarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Service de gestão de títulos a pagar.
 *
 * MUDANÇA Sprint 2.2-A1: Remove empresaPadraoId. Empresa vem do usuário logado.
 * Cada usuário só vê e cria títulos da SUA empresa (multi-tenant real).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TituloService {

    private final TituloRepository           tituloRepository;
    private final SaldoBancarioService       saldoBancarioService;
    private final MovimentoBancarioService   movimentoBancarioService;

    // ── Listagem com filtros ───────────────────────────────────────────────────

    public Page<Titulo> listar(UUID usuarioId, String status, String busca, int pagina, int tamanho) {
        tituloRepository.atualizarVencidos();

        String statusFiltro = (status == null || status.isBlank()) ? null : status.toUpperCase();
        String buscaFiltro  = (busca  == null || busca.isBlank())  ? null : busca.trim();
        return tituloRepository.findByUsuarioIdComFiltros(
                usuarioId, statusFiltro, buscaFiltro,
                PageRequest.of(pagina, tamanho)
        );
    }

    // ── Totalizadores ─────────────────────────────────────────────────────────

    public Map<String, Object> resumo(UUID usuarioId) {
        return Map.of(
                "totalAberto",   tituloRepository.totalSaldoAberto(usuarioId),
                "qtdPendentes",  tituloRepository.countByStatus(usuarioId, "PENDENTE"),
                "qtdVencidos",   tituloRepository.countByStatus(usuarioId, "VENCIDO"),
                "qtdPagos",      tituloRepository.countByStatus(usuarioId, "PAGO")
        );
    }

    // ── Cadastro manual ───────────────────────────────────────────────────────

    public Titulo criar(Titulo titulo, Usuario usuario) {
        validar(titulo);

        titulo.setUsuario(usuario);
        titulo.setEmpresa(usuario.getEmpresa());

        if (titulo.getSaldo() == null || titulo.getSaldo().compareTo(BigDecimal.ZERO) == 0) {
            titulo.setSaldo(titulo.getValor());
        }

        // ── Auditoria F1.1 ──
        titulo.setCriadoPor(usuario);

        titulo.atualizarStatus();
        return tituloRepository.save(titulo);
    }

    // ── Atualização (com regras ERP) ──────────────────────────────────────────

    public Titulo atualizar(UUID id, Titulo dados, Usuario usuario) {
        Titulo existente = tituloRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Título não encontrado"));

        if (!existente.getUsuario().getId().equals(usuario.getId())) {
            throw new SecurityException("Acesso negado");
        }

        if (temBaixa(existente)) {
            throw new IllegalStateException(
                    "Título com baixa registrada não pode ser editado. " +
                            "Estorne a baixa antes de alterar."
            );
        }

        validar(dados);

        // Numero, parcela e chave são auto-gerados — nunca sobrescrever na edição
        existente.setTipo(dados.getTipo());
        existente.setFornecedorNome(dados.getFornecedorNome());
        existente.setFornecedorDocumento(dados.getFornecedorDocumento());
        existente.setEmissao(dados.getEmissao());
        existente.setVencimento(dados.getVencimento());
        existente.setValor(dados.getValor());
        existente.setSaldo(dados.getSaldo());
        existente.setDesconto(dados.getDesconto());
        existente.setJuros(dados.getJuros());
        existente.setMulta(dados.getMulta());
        existente.setObservacao(dados.getObservacao());
        existente.setCodigoBarras(dados.getCodigoBarras());
        existente.setLinhaDigitavel(dados.getLinhaDigitavel());
        existente.setTipoGastoId(dados.getTipoGastoId());

        // ── Auditoria F1.1 ──
        existente.setAlteradoPor(usuario);

        if (!"PAGO".equals(dados.getStatus())) {
            existente.atualizarStatus();
        } else {
            existente.setStatus("PAGO");
        }

        return tituloRepository.save(existente);
    }

    // ── Baixa (pagamento total ou parcial) ────────────────────────────────────

    @Transactional
    public Titulo registrarBaixa(UUID id, BigDecimal valorPago, LocalDate dataBaixa,
                                 String observacao, UUID contaId, Usuario usuario) {
        Titulo titulo = tituloRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Título não encontrado"));

        if (!titulo.getUsuario().getId().equals(usuario.getId())) {
            throw new SecurityException("Acesso negado");
        }

        if (valorPago == null || valorPago.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor da baixa deve ser maior que zero");
        }

        SaldoBancario conta = contaId != null
                ? saldoBancarioService.buscarEntidadePorId(usuario, contaId)
                : saldoBancarioService.buscarContaPadrao(usuario);

        BigDecimal saldoAtual = titulo.getSaldo() != null ? titulo.getSaldo() : titulo.getValor();
        BigDecimal novoSaldo  = saldoAtual.subtract(valorPago);

        if (novoSaldo.compareTo(BigDecimal.ZERO) <= 0) {
            titulo.setSaldo(BigDecimal.ZERO);
            titulo.setStatus("PAGO");
            titulo.setDataBaixa(dataBaixa != null ? dataBaixa : LocalDate.now());
        } else {
            titulo.setSaldo(novoSaldo);
            titulo.setDataBaixa(dataBaixa != null ? dataBaixa : LocalDate.now());
            titulo.atualizarStatus();
        }

        if (valorPago.compareTo(saldoAtual) > 0) {
            BigDecimal acrescimo = valorPago.subtract(saldoAtual);
            BigDecimal jurosAtuais = titulo.getJuros() != null ? titulo.getJuros() : BigDecimal.ZERO;
            titulo.setJuros(jurosAtuais.add(acrescimo));
        }

        if (observacao != null && !observacao.isBlank()) {
            String obsAtual = titulo.getObservacao() != null ? titulo.getObservacao() : "";
            String dataStr  = dataBaixa != null ? dataBaixa.toString() : LocalDate.now().toString();
            titulo.setObservacao((obsAtual.isBlank() ? "" : obsAtual + " | ")
                    + "Baixa " + dataStr + ": " + fmtBrl(valorPago)
                    + (observacao.isBlank() ? "" : " — " + observacao));
        }

        Titulo salvo = tituloRepository.save(titulo);

        // ── Auditoria F1.1 ──
        salvo.setBaixadoPor(usuario);
        salvo.setBaixadoEm(java.time.LocalDateTime.now());
        salvo = tituloRepository.save(salvo);

        String descricao = "Pagamento de " +
                (titulo.getFornecedorNome() != null ? titulo.getFornecedorNome() : "fornecedor") +
                " — #" + titulo.getNumero();

        LocalDate dataMovimento = dataBaixa != null ? dataBaixa : LocalDate.now();

        movimentoBancarioService.criarPagamento(
                usuario, conta, dataMovimento, valorPago, descricao, salvo.getId()
        );

        log.info("Título baixado: {} (valor={}, conta={})",
                salvo.getId(), valorPago, conta.getNomeConta());
        return salvo;
    }

    // ── Estornar baixa ────────────────────────────────────────────────────────

    @Transactional
    public Titulo estornarBaixa(UUID id, Usuario usuario) {
        Titulo titulo = tituloRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Título não encontrado"));

        if (!titulo.getUsuario().getId().equals(usuario.getId())) {
            throw new SecurityException("Acesso negado");
        }

        List<MovimentoBancario> estornos = movimentoBancarioService.estornarPorOrigem(
                usuario, "TITULO", titulo.getId(),
                "Estorno de pagamento de título"
        );

        if (estornos.isEmpty()) {
            throw new IllegalStateException("Este título não possui pagamento para estornar.");
        }

        BigDecimal valorEstornado = estornos.stream()
                .map(MovimentoBancario::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoAtual = titulo.getSaldo() != null ? titulo.getSaldo() : BigDecimal.ZERO;
        titulo.setSaldo(saldoAtual.add(valorEstornado));
        titulo.setDataBaixa(null);

        // ── Auditoria F1.1: limpa baixa ──
        titulo.setBaixadoPor(null);
        titulo.setBaixadoEm(null);

        // Força status PENDENTE antes do atualizarStatus() (early-return em PAGO)
        titulo.setStatus("PENDENTE");
        titulo.atualizarStatus();

        Titulo salvo = tituloRepository.save(titulo);
        log.info("Título estornado: {} (valor estornado={})", salvo.getId(), valorEstornado);
        return salvo;
    }

    private static String fmtBrl(BigDecimal v) {
        return "R$ " + String.format("%.2f", v).replace(".", ",");
    }

    // ── Exclusão (com regra ERP) ──────────────────────────────────────────────

    public void excluir(UUID id, Usuario usuario) {
        Titulo titulo = tituloRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Título não encontrado"));

        if (!titulo.getUsuario().getId().equals(usuario.getId())) {
            throw new SecurityException("Acesso negado");
        }

        if (temBaixa(titulo)) {
            throw new IllegalStateException(
                    "Título com baixa registrada não pode ser excluído. " +
                            "Estorne a baixa primeiro."
            );
        }

        tituloRepository.delete(titulo);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean temBaixa(Titulo t) {
        if ("PAGO".equals(t.getStatus())) return true;
        if (t.getSaldo() != null && t.getValor() != null
                && t.getSaldo().compareTo(t.getValor()) < 0) {
            return true;
        }
        return false;
    }

    // ── Lançamento parcelado ──────────────────────────────────────────────────

    public record ParceladoRequest(
            Titulo templateTitulo,
            int    qtdParcelas,
            int    intervaloDias
    ) {}

    /**
     * Gera número sequencial: AP00001, AP00002...
     * Usa sequence do PostgreSQL (seq_titulo_numero).
     */
    private String gerarNumero() {
        Long seq = tituloRepository.proximoNumeroSequencia();
        return "AP" + String.format("%05d", seq);
    }

    public List<Titulo> criarParcelado(ParceladoRequest req, Usuario usuario) {
        if (req.qtdParcelas() < 2 || req.qtdParcelas() > 360) {
            throw new IllegalArgumentException("Número de parcelas deve ser entre 2 e 360.");
        }
        if (req.intervaloDias() < 1 || req.intervaloDias() > 365) {
            throw new IllegalArgumentException("Intervalo deve ser entre 1 e 365 dias.");
        }

        validar(req.templateTitulo());

        // Todas as parcelas compartilham o mesmo numero
        String numero = gerarNumero();

        List<Titulo> criados = new ArrayList<>();
        LocalDate vencimentoBase = req.templateTitulo().getVencimento();

        for (int i = 0; i < req.qtdParcelas(); i++) {
            int numeroParcela = i + 1;
            String parcelaStr = String.format("%02d", numeroParcela);
            LocalDate vencimento = vencimentoBase.plusDays((long) req.intervaloDias() * i);

            Titulo t = Titulo.builder()
                    .usuario(usuario)
                    .empresa(usuario.getEmpresa())
                    .prefixo(req.templateTitulo().getPrefixo() != null ? req.templateTitulo().getPrefixo() : "AP")
                    .numero(numero)
                    .parcela(parcelaStr)
                    .parcelaAtual(numeroParcela)
                    .parcelaTotal(req.qtdParcelas())
                    .tipo(req.templateTitulo().getTipo())
                    .tipoGastoId(req.templateTitulo().getTipoGastoId())
                    .fornecedorNome(req.templateTitulo().getFornecedorNome())
                    .fornecedorDocumento(req.templateTitulo().getFornecedorDocumento())
                    .emissao(req.templateTitulo().getEmissao() != null ? req.templateTitulo().getEmissao() : LocalDate.now())
                    .vencimento(vencimento)
                    .valor(req.templateTitulo().getValor())
                    .saldo(req.templateTitulo().getValor())
                    .desconto(req.templateTitulo().getDesconto() != null ? req.templateTitulo().getDesconto() : BigDecimal.ZERO)
                    .juros(BigDecimal.ZERO)
                    .multa(BigDecimal.ZERO)
                    .observacao(req.templateTitulo().getObservacao())
                    .criadoPor(usuario)
                    .build();

            t.montarChave();
            t.atualizarStatus();
            criados.add(tituloRepository.save(t));
        }

        log.info("Lançamento parcelado: {} parcelas, número {}, usuário {}",
                criados.size(), numero, usuario.getEmail());

        return criados;
    }

    // ── Relatórios ────────────────────────────────────────────────────────────

    public Map<String, Object> relatorioCompleto(UUID usuarioId) {
        LocalDate hoje = LocalDate.now();
        LocalDate fim  = hoje.withDayOfMonth(1).plusMonths(12).minusDays(1);
        List<Object[]> fluxo = tituloRepository.fluxoCaixaMensal(usuarioId, hoje, fim);

        List<Object[]> porTipo = tituloRepository.porCategoria(usuarioId);
        List<Object[]> fornecedores = tituloRepository.topFornecedores(usuarioId);
        List<Object[]> aging = tituloRepository.aging(usuarioId);

        return Map.of(
                "fluxoCaixa",   mapearFluxo(fluxo),
                "porCategoria", mapearCategoria(porTipo),
                "fornecedores", mapearCategoria(fornecedores),
                "aging",        mapearCategoria(aging)
        );
    }

    private List<Map<String, Object>> mapearFluxo(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("mes",       row[0]);
            m.put("total",     row[1]);
            m.put("quantidade", row[2]);
            result.add(m);
        }
        return result;
    }

    private List<Map<String, Object>> mapearCategoria(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("nome",      row[0]);
            m.put("total",     row[1]);
            m.put("quantidade", row[2]);
            result.add(m);
        }
        return result;
    }

    // ── Importação Excel ──────────────────────────────────────────────────────

    public ImportacaoResultado importarExcel(MultipartFile arquivo, Usuario usuario) throws IOException {
        List<String> erros    = new ArrayList<>();
        List<Titulo> salvos   = new ArrayList<>();
        int linha = 1;

        try (Workbook workbook = new XSSFWorkbook(arquivo.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue;
                linha = row.getRowNum() + 1;

                try {
                    String numero    = textoCell(row, 0);
                    String parcela   = textoCell(row, 1);
                    String tipo      = textoCell(row, 2).toUpperCase();
                    String nome      = textoCell(row, 3);
                    String documento = textoCell(row, 4);
                    LocalDate emissao    = dataCell(row, 5);
                    LocalDate vencimento = dataCell(row, 6);
                    BigDecimal valor     = valorCell(row, 7);

                    if (nome.isBlank() || valor == null) {
                        erros.add("Linha " + linha + ": campos obrigatórios ausentes (Nome, Valor)");
                        continue;
                    }

                    if (!List.of("PIX", "BOLETO", "TED").contains(tipo)) {
                        tipo = "BOLETO";
                    }

                    // Importação: gera numero sequencial, usa parcela do Excel se houver
                    String numeroGerado = gerarNumero();
                    String parcelaStr = parcela.isBlank() ? "01" : parcela;
                    // Normaliza pra 2 chars
                    if (parcelaStr.length() == 3 && parcelaStr.startsWith("0")) {
                        parcelaStr = parcelaStr.substring(1);
                    } else if (parcelaStr.length() == 1) {
                        parcelaStr = "0" + parcelaStr;
                    }
                    int parcelaInt = 1;
                    try { parcelaInt = Integer.parseInt(parcelaStr); } catch (NumberFormatException ignored) {}

                    Titulo titulo = Titulo.builder()
                            .usuario(usuario)
                            .empresa(usuario.getEmpresa())
                            .numero(numeroGerado)
                            .parcela(parcelaStr)
                            .parcelaAtual(parcelaInt)
                            .parcelaTotal(parcelaInt)
                            .tipo(tipo)
                            .fornecedorNome(nome)
                            .fornecedorDocumento(documento)
                            .emissao(emissao != null ? emissao : LocalDate.now())
                            .vencimento(vencimento != null ? vencimento : LocalDate.now())
                            .valor(valor)
                            .saldo(valor)
                            .desconto(BigDecimal.ZERO)
                            .juros(BigDecimal.ZERO)
                            .multa(BigDecimal.ZERO)
                            .criadoPor(usuario)
                            .build();

                    titulo.montarChave();
                    titulo.atualizarStatus();
                    salvos.add(tituloRepository.save(titulo));

                } catch (Exception e) {
                    erros.add("Linha " + linha + ": " + e.getMessage());
                }
            }
        }

        log.info("Importação Excel: {} títulos importados, {} erros — usuário: {}",
                salvos.size(), erros.size(), usuario.getEmail());

        return new ImportacaoResultado(salvos.size(), erros);
    }

    public record ImportacaoResultado(int importados, List<String> erros) {}

    // ── Helpers para leitura de células ───────────────────────────────────────

    private String textoCell(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                yield v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
            }
            default -> "";
        };
    }

    private LocalDate dataCell(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            }
            if (cell.getCellType() == CellType.STRING) {
                String s = cell.getStringCellValue().trim();
                if (s.matches("\\d{2}/\\d{2}/\\d{4}")) {
                    String[] p = s.split("/");
                    return LocalDate.of(Integer.parseInt(p[2]), Integer.parseInt(p[1]), Integer.parseInt(p[0]));
                }
                return LocalDate.parse(s);
            }
        } catch (Exception ignored) {}
        return null;
    }

    private BigDecimal valorCell(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            }
            if (cell.getCellType() == CellType.STRING) {
                String s = cell.getStringCellValue().trim()
                        .replace("R$", "").replace(".", "").replace(",", ".").trim();
                return new BigDecimal(s);
            }
        } catch (Exception ignored) {}
        return null;
    }

    // ── Validação ─────────────────────────────────────────────────────────────

    private void validar(Titulo t) {
        if (t.getValor() == null || t.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor deve ser maior que zero");
        }
        if (t.getVencimento() != null && t.getEmissao() != null
                && t.getVencimento().isBefore(t.getEmissao())) {
            throw new IllegalArgumentException("Vencimento não pode ser anterior à emissão");
        }
        if (t.getTipo() != null && !List.of("PIX", "BOLETO", "TED").contains(t.getTipo())) {
            throw new IllegalArgumentException("Tipo inválido: use PIX, BOLETO ou TED");
        }
    }
}