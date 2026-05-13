package com.pedrocampelo.cnabportal.service.recebimentossv;

import com.pedrocampelo.cnabportal.dto.RecebimentoOperacoes.ReceberRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoParceladoRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoResponse;
import com.pedrocampelo.cnabportal.model.Cliente;
import com.pedrocampelo.cnabportal.model.Recebimento;
import com.pedrocampelo.cnabportal.model.SaldoBancario;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.RecebimentoRepository;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.MovimentoBancarioService;
import com.pedrocampelo.cnabportal.service.fluxocaixasv.SaldoBancarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * RecebimentoService — Sprint F1.1: auditoria completa + código legível.
 *
 * Mudanças F1.1:
 *   - Cada operação grava quem fez (criadoPor, alteradoPor, baixadoPor, canceladoPor)
 *   - Código legível auto-gerado (RC-00001)
 *   - Listagens com @Transactional(readOnly=true) pra resolver lazy proxies de auditoria
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecebimentoService {

    private final RecebimentoRepository      recebimentoRepository;
    private final ClienteService             clienteService;
    private final SaldoBancarioService       saldoBancarioService;
    private final MovimentoBancarioService   movimentoBancarioService;

    // ─────────────────────────────────────────────────────────────────────────
    // Listagem e resumo
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<RecebimentoResponse> listar(Usuario usuario, String status, UUID clienteId,
                                            int pagina, int tamanho) {
        UUID empresaId = usuario.getEmpresa().getId();
        var pageable = PageRequest.of(pagina, Math.min(tamanho, 100),
                Sort.by("dataVencimento").descending());

        Page<Recebimento> page;
        atualizarStatusAtrasados(empresaId);

        if (clienteId != null) {
            page = recebimentoRepository.findByEmpresaIdAndClienteId(empresaId, clienteId, pageable);
        } else if (status != null && !status.isBlank()) {
            page = recebimentoRepository.findByEmpresaIdAndStatus(empresaId, status.toUpperCase(), pageable);
        } else {
            page = recebimentoRepository.findByEmpresaId(empresaId, pageable);
        }

        return page.map(RecebimentoResponse::from);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> resumo(Usuario usuario) {
        UUID empresaId = usuario.getEmpresa().getId();
        atualizarStatusAtrasados(empresaId);

        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        LocalDate fimMes = hoje.withDayOfMonth(hoje.lengthOfMonth());

        BigDecimal aReceberMes = recebimentoRepository.somarPendentesNoPeriodo(empresaId, inicioMes, fimMes);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("aReceberMes",       aReceberMes);
        resumo.put("qtdAtrasados",      recebimentoRepository.listarAtrasados(empresaId).size());
        resumo.put("qtdProximosVencer", recebimentoRepository.listarProximosAVencer(empresaId, hoje.plusDays(7)).size());
        return resumo;
    }

    @Transactional(readOnly = true)
    public RecebimentoResponse buscarPorId(Usuario usuario, UUID id) {
        Recebimento r = buscarEntidadePorId(usuario, id);
        return RecebimentoResponse.from(r);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Criação simples
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public RecebimentoResponse criar(Usuario usuario, RecebimentoRequest request) {
        Cliente cliente = clienteService.buscarEntidadePorId(usuario, request.clienteId());

        Recebimento novo = Recebimento.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .cliente(cliente)
                .codigo(gerarCodigo())
                .numero(gerarNumero())
                .descricao(request.descricao().trim())
                .categoria(request.categoria())
                .dataEmissao(request.dataEmissao() != null ? request.dataEmissao() : LocalDate.now())
                .dataVencimento(request.dataVencimento())
                .valor(request.valor())
                .valorRecebido(BigDecimal.ZERO)
                .formaPagamento(request.formaPagamento() != null ? request.formaPagamento() : "PIX")
                .parcelaAtual(request.parcelaAtual() != null ? request.parcelaAtual() : 1)
                .parcelaTotal(request.parcelaTotal() != null ? request.parcelaTotal() : 1)
                .recorrente(Boolean.TRUE.equals(request.recorrente()))
                .recorrenciaTipo(request.recorrenciaTipo())
                .observacao(request.observacao())
                .origem(request.observacao() != null && request.observacao().contains("Via WhatsApp") ? "WHATSAPP" : "MANUAL")
                // ── Auditoria F1.1 ──
                .criadoPor(usuario)
                .build();

        novo.atualizarStatus();
        Recebimento salvo = recebimentoRepository.save(novo);
        log.info("Recebimento criado: {} código={} (cliente={}, valor={})",
                salvo.getId(), salvo.getCodigo(), cliente.getNome(), salvo.getValor());

        return RecebimentoResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Criação parcelada
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public List<RecebimentoResponse> criarParcelado(Usuario usuario, RecebimentoParceladoRequest request) {
        Cliente cliente = clienteService.buscarEntidadePorId(usuario, request.clienteId());

        int qtd = request.qtdParcelas();
        BigDecimal valorTotal = request.valorTotal();

        BigDecimal valorPorParcela = valorTotal
                .divide(BigDecimal.valueOf(qtd), 2, RoundingMode.HALF_UP);
        BigDecimal somaParcelasIgual = valorPorParcela.multiply(BigDecimal.valueOf(qtd - 1));
        BigDecimal valorUltimaParcela = valorTotal.subtract(somaParcelasIgual);

        String numeroSerie = gerarNumero();
        String formaPagamento = request.formaPagamento() != null ? request.formaPagamento() : "PIX";
        LocalDate hoje = LocalDate.now();

        List<Recebimento> criados = new ArrayList<>();

        for (int i = 0; i < qtd; i++) {
            int numeroParcela = i + 1;
            boolean ehUltima = (i == qtd - 1);
            BigDecimal valorParcela = ehUltima ? valorUltimaParcela : valorPorParcela;
            LocalDate vencimento = request.dataVencimentoPrimeira()
                    .plusDays((long) request.intervaloDias() * i);

            Recebimento r = Recebimento.builder()
                    .empresa(usuario.getEmpresa())
                    .usuario(usuario)
                    .cliente(cliente)
                    .codigo(gerarCodigo())
                    .numero(numeroSerie)
                    .descricao(request.descricao().trim() + " (" + numeroParcela + "/" + qtd + ")")
                    .categoria(request.categoria())
                    .dataEmissao(hoje)
                    .dataVencimento(vencimento)
                    .valor(valorParcela)
                    .valorRecebido(BigDecimal.ZERO)
                    .formaPagamento(formaPagamento)
                    .parcelaAtual(numeroParcela)
                    .parcelaTotal(qtd)
                    .recorrente(false)
                    .observacao(request.observacao())
                    // ── Auditoria F1.1 ──
                    .criadoPor(usuario)
                    .build();

            r.atualizarStatus();
            criados.add(recebimentoRepository.save(r));
        }

        log.info("Recebimento parcelado criado: {} parcelas, número série {}, cliente {}, total R$ {}",
                qtd, numeroSerie, cliente.getNome(), valorTotal);

        return criados.stream().map(RecebimentoResponse::from).toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edição (com regra ERP — bloqueia se tem baixa)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public RecebimentoResponse atualizar(Usuario usuario, UUID id, RecebimentoRequest request) {
        Recebimento r = buscarEntidadePorId(usuario, id);

        if (r.temBaixa()) {
            throw new IllegalStateException(
                    "Recebimento com baixa registrada não pode ser editado. " +
                            "Estorne a baixa antes de alterar."
            );
        }
        if ("CANCELADO".equals(r.getStatus())) {
            throw new IllegalStateException("Recebimento cancelado não pode ser editado.");
        }

        if (!r.getCliente().getId().equals(request.clienteId())) {
            r.setCliente(clienteService.buscarEntidadePorId(usuario, request.clienteId()));
        }

        r.setDescricao(request.descricao().trim());
        r.setCategoria(request.categoria());
        if (request.dataEmissao() != null)    r.setDataEmissao(request.dataEmissao());
        r.setDataVencimento(request.dataVencimento());
        r.setValor(request.valor());
        if (request.formaPagamento() != null) r.setFormaPagamento(request.formaPagamento());
        if (request.parcelaAtual() != null)   r.setParcelaAtual(request.parcelaAtual());
        if (request.parcelaTotal() != null)   r.setParcelaTotal(request.parcelaTotal());
        r.setRecorrente(Boolean.TRUE.equals(request.recorrente()));
        r.setRecorrenciaTipo(request.recorrenciaTipo());
        r.setObservacao(request.observacao());

        // ── Auditoria F1.1 ──
        r.setAlteradoPor(usuario);

        r.atualizarStatus();
        Recebimento salvo = recebimentoRepository.save(r);
        log.info("Recebimento atualizado: {} por {}", salvo.getId(), usuario.getNome());
        return RecebimentoResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECEBER (DAR BAIXA)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public RecebimentoResponse receber(Usuario usuario, UUID id, ReceberRequest request) {
        Recebimento r = buscarEntidadePorId(usuario, id);

        if ("RECEBIDO".equals(r.getStatus())) {
            throw new IllegalStateException("Recebimento já está totalmente recebido");
        }
        if ("CANCELADO".equals(r.getStatus())) {
            throw new IllegalStateException("Recebimento cancelado não pode ser baixado");
        }

        BigDecimal saldo = r.getSaldoPendente();
        BigDecimal valorRecebimento = request.valor() != null ? request.valor() : saldo;

        if (valorRecebimento.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor de recebimento deve ser maior que zero");
        }
        if (valorRecebimento.compareTo(saldo) > 0) {
            throw new IllegalArgumentException(
                    "Valor recebido (R$ " + valorRecebimento + ") maior que saldo pendente (R$ " + saldo + ")"
            );
        }

        SaldoBancario conta = resolverConta(usuario, request.contaId());

        LocalDate dataMovimento = request.dataRecebimento() != null
                ? request.dataRecebimento()
                : LocalDate.now();

        r.setValorRecebido(r.getValorRecebido().add(valorRecebimento));
        if (r.getDataRecebimento() == null) {
            r.setDataRecebimento(dataMovimento);
        }

        // ── Auditoria F1.1 ──
        r.setBaixadoPor(usuario);
        r.setBaixadoEm(LocalDateTime.now());

        r.atualizarStatus();
        Recebimento salvo = recebimentoRepository.save(r);

        String descricao = "Recebimento de " + r.getCliente().getNome() + " — " + r.getDescricao();
        movimentoBancarioService.criarRecebimento(
                usuario, conta, dataMovimento, valorRecebimento, descricao, salvo.getId()
        );

        log.info("Recebimento baixado: {} por {} (valor={}, conta={}, status={})",
                salvo.getId(), usuario.getNome(), valorRecebimento, conta.getNomeConta(), salvo.getStatus());
        return RecebimentoResponse.from(salvo);
    }

    private SaldoBancario resolverConta(Usuario usuario, UUID contaId) {
        if (contaId != null) {
            return saldoBancarioService.buscarEntidadePorId(usuario, contaId);
        }
        return saldoBancarioService.buscarContaPadrao(usuario);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ESTORNAR BAIXA
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public RecebimentoResponse estornarBaixa(Usuario usuario, UUID id) {
        Recebimento r = buscarEntidadePorId(usuario, id);

        if (!r.temBaixa()) {
            throw new IllegalStateException("Este recebimento não possui baixa para estornar.");
        }

        movimentoBancarioService.estornarPorOrigem(
                usuario, "RECEBIMENTO", r.getId(),
                "Estorno de baixa do recebimento"
        );

        BigDecimal valorEstornado = r.getValorRecebido();
        r.setValorRecebido(BigDecimal.ZERO);
        r.setDataRecebimento(null);

        // ── Auditoria F1.1: limpa baixa, mantém histórico via log ──
        r.setBaixadoPor(null);
        r.setBaixadoEm(null);

        r.atualizarStatus();

        Recebimento salvo = recebimentoRepository.save(r);
        log.info("Recebimento estornado: {} por {} (valor estornado={})",
                salvo.getId(), usuario.getNome(), valorEstornado);
        return RecebimentoResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cancelar e excluir
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public RecebimentoResponse cancelar(Usuario usuario, UUID id) {
        Recebimento r = buscarEntidadePorId(usuario, id);

        if ("RECEBIDO".equals(r.getStatus())) {
            throw new IllegalStateException(
                    "Recebimento já recebido não pode ser cancelado. Estorne a baixa primeiro."
            );
        }
        if (r.temBaixa()) {
            throw new IllegalStateException(
                    "Recebimento com baixa parcial não pode ser cancelado. Estorne a baixa primeiro."
            );
        }
        if ("CANCELADO".equals(r.getStatus())) {
            throw new IllegalStateException("Recebimento já está cancelado.");
        }

        r.setStatus("CANCELADO");

        // ── Auditoria F1.1 ──
        r.setCanceladoPor(usuario);
        r.setCanceladoEm(LocalDateTime.now());

        Recebimento salvo = recebimentoRepository.save(r);
        log.info("Recebimento cancelado: {} por {}", id, usuario.getNome());
        return RecebimentoResponse.from(salvo);
    }

    @Transactional
    public void excluir(Usuario usuario, UUID id) {
        Recebimento r = buscarEntidadePorId(usuario, id);

        if (r.temBaixa()) {
            throw new IllegalStateException(
                    "Recebimento com baixa não pode ser excluído. Estorne a baixa primeiro."
            );
        }

        recebimentoRepository.delete(r);
        log.info("Recebimento excluído: {} por {}", id, usuario.getNome());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public Recebimento buscarEntidadePorId(Usuario usuario, UUID id) {
        return recebimentoRepository
                .findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Recebimento não encontrado"));
    }

    private void atualizarStatusAtrasados(UUID empresaId) {
        var atrasados = recebimentoRepository.listarAtrasados(empresaId);
        for (var r : atrasados) {
            if (!"ATRASADO".equals(r.getStatus())) {
                r.atualizarStatus();
            }
        }
        if (!atrasados.isEmpty()) {
            recebimentoRepository.saveAll(atrasados);
        }
    }

    /**
     * Gera código legível sequencial: RC-00001, RC-00002...
     * Usa sequence do PostgreSQL pra garantir unicidade mesmo sob concorrência.
     */
    private String gerarCodigo() {
        Long seq = recebimentoRepository.proximoCodigoSequencia();
        return "RC-" + String.format("%05d", seq);
    }

    private String gerarNumero() {
        long ts = System.currentTimeMillis();
        return "R-" + Long.toString(ts, 36).toUpperCase();
    }
}