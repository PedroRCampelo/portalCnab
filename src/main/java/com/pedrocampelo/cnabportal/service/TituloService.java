package com.pedrocampelo.cnabportal.service;

import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import com.pedrocampelo.cnabportal.repository.TituloRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TituloService {

    private final TituloRepository  tituloRepository;
    private final EmpresaRepository empresaRepository;

    @Value("${app.empresa-padrao-id:00000000-0000-0000-0000-000000000001}")
    private String empresaPadraoId;

    // ── Listagem com filtros ───────────────────────────────────────────────────

    public Page<Titulo> listar(UUID usuarioId, String status, String busca, int pagina, int tamanho) {
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
        Empresa empresa = empresaRepository.findById(UUID.fromString(empresaPadraoId))
                .orElseThrow(() -> new IllegalStateException("Empresa padrão não encontrada"));

        titulo.setUsuario(usuario);
        titulo.setEmpresa(empresa);

        // Saldo inicial = valor (sem pagamento parcial)
        if (titulo.getSaldo() == null || titulo.getSaldo().compareTo(BigDecimal.ZERO) == 0) {
            titulo.setSaldo(titulo.getValor());
        }

        titulo.atualizarStatus();
        return tituloRepository.save(titulo);
    }

    // ── Atualização ───────────────────────────────────────────────────────────

    public Titulo atualizar(UUID id, Titulo dados, Usuario usuario) {
        Titulo existente = tituloRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Título não encontrado"));

        if (!existente.getUsuario().getId().equals(usuario.getId())) {
            throw new SecurityException("Acesso negado");
        }

        validar(dados);

        existente.setPrefixo(dados.getPrefixo());
        existente.setNumero(dados.getNumero());
        existente.setParcela(dados.getParcela());
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

        // Só atualiza status se não for PAGO
        if (!"PAGO".equals(dados.getStatus())) {
            existente.atualizarStatus();
        } else {
            existente.setStatus("PAGO");
        }

        return tituloRepository.save(existente);
    }

    // ── Exclusão ──────────────────────────────────────────────────────────────

    public void excluir(UUID id, Usuario usuario) {
        Titulo titulo = tituloRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Título não encontrado"));

        if (!titulo.getUsuario().getId().equals(usuario.getId())) {
            throw new SecurityException("Acesso negado");
        }

        tituloRepository.delete(titulo);
    }

    // ── Importação Excel ──────────────────────────────────────────────────────
    //
    // Colunas esperadas (linha 1 = cabeçalho, linha 2+ = dados):
    // A: Número | B: Parcela | C: Tipo | D: Nome | E: Documento
    // F: Emissão | G: Vencimento | H: Valor
    //

    public ImportacaoResultado importarExcel(MultipartFile arquivo, Usuario usuario) throws IOException {
        Empresa empresa = empresaRepository.findById(UUID.fromString(empresaPadraoId))
                .orElseThrow(() -> new IllegalStateException("Empresa padrão não encontrada"));

        List<String> erros    = new ArrayList<>();
        List<Titulo> salvos   = new ArrayList<>();
        int linha = 1;

        try (Workbook workbook = new XSSFWorkbook(arquivo.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // pula cabeçalho
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

                    if (numero.isBlank() || nome.isBlank() || valor == null) {
                        erros.add("Linha " + linha + ": campos obrigatórios ausentes (Número, Nome, Valor)");
                        continue;
                    }

                    if (!List.of("PIX", "BOLETO", "TED").contains(tipo)) {
                        tipo = "BOLETO";
                    }

                    Titulo titulo = Titulo.builder()
                            .usuario(usuario)
                            .empresa(empresa)
                            .numero(numero)
                            .parcela(parcela.isBlank() ? "001" : parcela)
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
                            .build();

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
                // Aceita dd/MM/yyyy ou yyyy-MM-dd
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