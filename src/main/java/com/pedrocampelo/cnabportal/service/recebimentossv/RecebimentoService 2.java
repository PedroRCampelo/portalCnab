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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * RecebimentoService — versão integrada com módulo Fluxo de Caixa.
 *
 * MUDANÇAS PARTE 2:
 *   - receber() agora cria movimento bancário automaticamente
 *   - estornarBaixa() cria movimento de compensação
 *   - Validação: precisa ter conta bancária cadastrada antes de baixar
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
    // Listagem e resumo (sem mudanças)
    // ─────────────────────────────────────────────────────────────────────────

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

    public RecebimentoResponse buscarPorId(Usuario usuario, UUID id) {
        Recebimento r = buscarEntidadePorId(usuario, id);
        return RecebimentoResponse.from(r);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Criação simples (sem mudanças)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public RecebimentoResponse criar(Usuario usuario, RecebimentoRequest request) {
        Cliente cliente = clienteService.buscarEntidadePorId(usuario, request.clienteId());

        Recebimento novo = Recebimento.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .cliente(cliente)
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
                .build();

        novo.atualizarStatus();
        Recebimento salvo = recebimentoRepository.save(novo);
        log.info("Recebimento criado: {} (cliente={}, valor={})",
                salvo.getId(), cliente.getNome(), salvo.getValor());

        return RecebimentoResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Criação parcelada (sem mudanças)
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

        r.atualizarStatus();
        Recebimento salvo = recebimentoRepository.save(r);
        log.info("Recebimento atualizado: {}", salvo.getId());
        return RecebimentoResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECEBER (DAR BAIXA) — INTEGRAÇÃO COM MOVIMENTO BANCÁRIO
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Registra recebimento (parcial ou total) E cria movimento bancário.
     *
     * Fluxo:
     *   1. Valida estado do recebimento
     *   2. Determina conta bancária:
     *      - Se contaId vier no request: usa essa
     *      - Se null: usa conta padrão (principal ou única)
     *   3. Atualiza valor recebido + status do Recebimento
     *   4. Cria movimento bancário do tipo RECEBIMENTO
     *   5. Saldo da conta é recalculado automaticamente na próxima consulta
     *
     * Importante: a operação é transacional. Se a criação do movimento falhar,
     * o recebimento NÃO é marcado como baixado (rollback).
     */
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

        // ── Determina a conta bancária do movimento ──────────────────────────
        SaldoBancario conta = resolverConta(usuario, request.contaId());

        // ── Atualiza Recebimento ─────────────────────────────────────────────
        LocalDate dataMovimento = request.dataRecebimento() != null
                ? request.dataRecebimento()
                : LocalDate.now();

        r.setValorRecebido(r.getValorRecebido().add(valorRecebimento));
        if (r.getDataRecebimento() == null) {
            r.setDataRecebimento(dataMovimento);
        }
        r.atualizarStatus();
        Recebimento salvo = recebimentoRepository.save(r);

        // ── Cria movimento bancário ──────────────────────────────────────────
        String descricao = "Recebimento de " + r.getCliente().getNome() + " — " + r.getDescricao();
        movimentoBancarioService.criarRecebimento(
                usuario, conta, dataMovimento, valorRecebimento, descricao, salvo.getId()
        );

        log.info("Recebimento baixado: {} (valor={}, conta={}, status={})",
                salvo.getId(), valorRecebimento, conta.getNomeConta(), salvo.getStatus());
        return RecebimentoResponse.from(salvo);
    }

    /**
     * Resolve qual conta usar pra o movimento.
     * Prioridade: 1) contaId do request, 2) conta padrão da empresa.
     */
    private SaldoBancario resolverConta(Usuario usuario, UUID contaId) {
        if (contaId != null) {
            return saldoBancarioService.buscarEntidadePorId(usuario, contaId);
        }
        // Sem conta especificada — usa padrão (principal ou primeira disponível)
        return saldoBancarioService.buscarContaPadrao(usuario);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ESTORNAR BAIXA — INTEGRAÇÃO COM MOVIMENTO BANCÁRIO
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Estorna a baixa do recebimento E cria movimento(s) de compensação.
     *
     * Fluxo:
     *   1. Valida que tem baixa pra estornar
     *   2. Estorna TODOS os movimentos ativos vinculados a este recebimento
     *      (pode ter múltiplos se foram baixas parciais)
     *   3. Zera valor recebido e data de recebimento no Recebimento
     *   4. Recalcula status (volta pra PENDENTE/ATRASADO)
     */
    @Transactional
    public RecebimentoResponse estornarBaixa(Usuario usuario, UUID id) {
        Recebimento r = buscarEntidadePorId(usuario, id);

        if (!r.temBaixa()) {
            throw new IllegalStateException("Este recebimento não possui baixa para estornar.");
        }

        // ── Estorna todos os movimentos vinculados ───────────────────────────
        movimentoBancarioService.estornarPorOrigem(
                usuario, "RECEBIMENTO", r.getId(),
                "Estorno de baixa do recebimento"
        );

        // ── Zera valores no Recebimento ──────────────────────────────────────
        BigDecimal valorEstornado = r.getValorRecebido();
        r.setValorRecebido(BigDecimal.ZERO);
        r.setDataRecebimento(null);
        r.atualizarStatus();

        Recebimento salvo = recebimentoRepository.save(r);
        log.info("Recebimento estornado: {} (valor estornado={})", salvo.getId(), valorEstornado);
        return RecebimentoResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cancelar e excluir (sem mudanças vs Sprint 1)
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
        Recebimento salvo = recebimentoRepository.save(r);
        log.info("Recebimento cancelado: {}", id);
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
        log.info("Recebimento excluído: {}", id);
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

    private String gerarNumero() {
        long ts = System.currentTimeMillis();
        return "R-" + Long.toString(ts, 36).toUpperCase();
    }
}