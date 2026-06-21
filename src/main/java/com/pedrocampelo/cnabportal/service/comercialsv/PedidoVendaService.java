package com.pedrocampelo.cnabportal.service.comercialsv;

import com.pedrocampelo.cnabportal.dto.ItemRequest;
import com.pedrocampelo.cnabportal.dto.PedidoVendaRequest;
import com.pedrocampelo.cnabportal.dto.PedidoVendaResponse;
import com.pedrocampelo.cnabportal.dto.RecebimentoParceladoRequest;
import com.pedrocampelo.cnabportal.dto.RecebimentoRequest;
import com.pedrocampelo.cnabportal.model.Cliente;
import com.pedrocampelo.cnabportal.model.ItemPedidoVenda;
import com.pedrocampelo.cnabportal.model.Orcamento;
import com.pedrocampelo.cnabportal.model.PedidoVenda;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.PedidoVendaRepository;
import com.pedrocampelo.cnabportal.service.NumeradorEmpresaService;
import com.pedrocampelo.cnabportal.service.recebimentossv.ClienteService;
import com.pedrocampelo.cnabportal.service.recebimentossv.RecebimentoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoVendaService {

    private final PedidoVendaRepository  pedidoVendaRepository;
    private final ClienteService          clienteService;
    private final OrcamentoService        orcamentoService;
    private final RecebimentoService      recebimentoService;
    private final NumeradorEmpresaService numeradorService;

    // ─────────────────────────────────────────────────────────────────────────
    // Listagem
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PedidoVendaResponse> listar(Usuario usuario, String status, UUID clienteId,
                                            int pagina, int tamanho) {
        UUID empresaId = usuario.getEmpresa().getId();
        var pageable = PageRequest.of(pagina, Math.min(tamanho, 100),
                Sort.by("criadoEm").descending());

        Page<PedidoVenda> page;
        if (clienteId != null) {
            page = pedidoVendaRepository.findByEmpresaIdAndClienteId(empresaId, clienteId, pageable);
        } else if (status != null && !status.isBlank()) {
            page = pedidoVendaRepository.findByEmpresaIdAndStatus(empresaId, status.toUpperCase(), pageable);
        } else {
            page = pedidoVendaRepository.findByEmpresaId(empresaId, pageable);
        }

        return page.map(PedidoVendaResponse::from);
    }

    @Transactional(readOnly = true)
    public PedidoVendaResponse buscarPorId(Usuario usuario, UUID id) {
        return PedidoVendaResponse.from(buscarEntidade(usuario, id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public PedidoVendaResponse criar(Usuario usuario, PedidoVendaRequest req) {
        Cliente cliente = clienteService.buscarEntidadePorId(usuario, req.clienteId());

        Orcamento orcamento = null;
        if (req.orcamentoId() != null) {
            orcamento = orcamentoService.buscarEntidade(usuario, req.orcamentoId());
            if (!"APROVADO".equals(orcamento.getStatus())) {
                throw new IllegalStateException("Apenas orçamentos com status APROVADO podem ser vinculados a um pedido.");
            }
        }

        PedidoVenda pedido = PedidoVenda.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .cliente(cliente)
                .orcamento(orcamento)
                .numero(gerarNumero(usuario.getEmpresa().getId()))
                .status("ABERTO")
                .descricao(req.descricao() != null ? req.descricao().trim() : "Pedido de Venda")
                .observacoes(req.observacoes())
                .formaPagamento(req.formaPagamento() != null ? req.formaPagamento() : "PIX")
                .numParcelas(req.numParcelas() != null ? req.numParcelas() : 1)
                .intervaloDias(req.intervaloDias() != null ? req.intervaloDias() : 30)
                .primeiroVencimento(req.primeiroVencimento())
                .categoriaId(req.categoriaId())
                .criadoPor(usuario)
                .build();

        adicionarItens(pedido, req.itens());
        pedido.recalcularTotal();

        PedidoVenda salvo = pedidoVendaRepository.save(pedido);

        if (orcamento != null) {
            orcamento.setStatus("EM_PEDIDO");
            orcamento.setAlteradoPor(usuario);
            orcamentoService.salvarEntidade(orcamento);
        }

        log.info("Pedido de venda criado: {} número={}", salvo.getId(), salvo.getNumero());
        return PedidoVendaResponse.from(salvo);
    }

    @Transactional
    public PedidoVendaResponse atualizar(Usuario usuario, UUID id, PedidoVendaRequest req) {
        PedidoVenda pedido = buscarEntidade(usuario, id);

        if (!pedido.isEditavel()) {
            throw new IllegalStateException("Pedido " + pedido.getNumero() + " não pode ser editado no status " + pedido.getStatus());
        }

        Cliente cliente = clienteService.buscarEntidadePorId(usuario, req.clienteId());
        pedido.setCliente(cliente);
        pedido.setDescricao(req.descricao() != null ? req.descricao().trim() : pedido.getDescricao());
        pedido.setObservacoes(req.observacoes());
        pedido.setFormaPagamento(req.formaPagamento() != null ? req.formaPagamento() : pedido.getFormaPagamento());
        pedido.setNumParcelas(req.numParcelas() != null ? req.numParcelas() : pedido.getNumParcelas());
        pedido.setIntervaloDias(req.intervaloDias() != null ? req.intervaloDias() : pedido.getIntervaloDias());
        pedido.setPrimeiroVencimento(req.primeiroVencimento());
        pedido.setCategoriaId(req.categoriaId());
        pedido.setAlteradoPor(usuario);

        pedido.getItens().clear();
        adicionarItens(pedido, req.itens());
        pedido.recalcularTotal();

        return PedidoVendaResponse.from(pedidoVendaRepository.save(pedido));
    }

    @Transactional
    public PedidoVendaResponse cancelar(Usuario usuario, UUID id) {
        PedidoVenda pedido = buscarEntidade(usuario, id);

        if ("EFETIVADO".equals(pedido.getStatus())) {
            throw new IllegalStateException("Pedido já efetivado não pode ser cancelado. Cancele os recebimentos gerados.");
        }
        if ("CANCELADO".equals(pedido.getStatus())) {
            throw new IllegalStateException("Pedido já está cancelado.");
        }

        pedido.setStatus("CANCELADO");
        pedido.setCanceladoPor(usuario);
        pedido.setCanceladoEm(LocalDateTime.now());

        return PedidoVendaResponse.from(pedidoVendaRepository.save(pedido));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Efetivar — gera recebimentos no módulo financeiro
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public PedidoVendaResponse efetivar(Usuario usuario, UUID id) {
        PedidoVenda pedido = buscarEntidade(usuario, id);

        if (!pedido.isEfetivavel()) {
            throw new IllegalStateException("Pedido " + pedido.getNumero() + " não pode ser efetivado no status " + pedido.getStatus());
        }

        String descricaoRec = "Pedido " + pedido.getNumero()
                + (pedido.getDescricao() != null ? " — " + pedido.getDescricao() : "");

        try {
            if (pedido.getNumParcelas() > 1) {
                var parceladoReq = new RecebimentoParceladoRequest(
                        pedido.getCliente().getId(),
                        descricaoRec,
                        null,
                        pedido.getPrimeiroVencimento(),
                        pedido.getValorTotal(),
                        pedido.getNumParcelas(),
                        pedido.getIntervaloDias(),
                        pedido.getFormaPagamento(),
                        "Gerado automaticamente pelo Pedido de Venda " + pedido.getNumero()
                );
                recebimentoService.criarParcelado(usuario, parceladoReq);
            } else {
                var req = new RecebimentoRequest(
                        pedido.getCliente().getId(),
                        descricaoRec,
                        null,
                        pedido.getCategoriaId(),
                        null,
                        pedido.getPrimeiroVencimento(),
                        pedido.getValorTotal(),
                        pedido.getFormaPagamento(),
                        1,
                        1,
                        false,
                        null,
                        "Gerado automaticamente pelo Pedido de Venda " + pedido.getNumero()
                );
                recebimentoService.criar(usuario, req);
            }
        } catch (Exception ex) {
            log.error("Falha ao gerar recebimentos para pedido {}: {}", pedido.getNumero(), ex.getMessage(), ex);
            throw ex;
        }

        pedido.setStatus("EFETIVADO");
        pedido.setEfetivadoPor(usuario);
        pedido.setEfetivadoEm(LocalDateTime.now());

        PedidoVenda salvo = pedidoVendaRepository.save(pedido);
        log.info("Pedido {} efetivado — {} recebimento(s) gerado(s)", salvo.getNumero(), salvo.getNumParcelas());
        return PedidoVendaResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Copiar pedido
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public PedidoVendaResponse copiarPedido(Usuario usuario, UUID id) {
        PedidoVenda original = buscarEntidade(usuario, id);

        List<ItemRequest> itensReq = original.getItens().stream()
                .map(i -> new ItemRequest(i.getDescricao(), i.getQuantidade(),
                        i.getValorUnitario(), i.getDesconto(), i.getOrdem()))
                .toList();

        PedidoVenda copia = PedidoVenda.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .cliente(original.getCliente())
                .numero(gerarNumero(usuario.getEmpresa().getId()))
                .status("ABERTO")
                .descricao("Cópia — " + (original.getDescricao() != null ? original.getDescricao() : original.getNumero()))
                .observacoes(original.getObservacoes())
                .formaPagamento(original.getFormaPagamento())
                .numParcelas(original.getNumParcelas())
                .intervaloDias(original.getIntervaloDias())
                .primeiroVencimento(original.getPrimeiroVencimento())
                .categoriaId(original.getCategoriaId())
                .criadoPor(usuario)
                .build();

        adicionarItens(copia, itensReq);
        copia.recalcularTotal();

        PedidoVenda salvo = pedidoVendaRepository.save(copia);
        log.info("Pedido {} copiado como {}", original.getNumero(), salvo.getNumero());
        return PedidoVendaResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Converter orçamento → pedido
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public PedidoVendaResponse converterDeOrcamento(Usuario usuario, UUID orcamentoId) {
        Orcamento orc = orcamentoService.buscarEntidade(usuario, orcamentoId);

        if (!"APROVADO".equals(orc.getStatus())) {
            throw new IllegalStateException(
                    "Apenas orçamentos APROVADOS podem ser convertidos em pedido. Status atual: " + orc.getStatus());
        }

        String formaPag = orc.getFormaPagamento();
        if (formaPag == null || "A_DEFINIR".equals(formaPag) || "CHEQUE".equals(formaPag)) {
            formaPag = "OUTROS";
        }

        List<ItemRequest> itensReq = orc.getItens().stream()
                .map(i -> new ItemRequest(i.getDescricao(), i.getQuantidade(),
                        i.getValorUnitario(), i.getDesconto(), i.getOrdem()))
                .toList();

        PedidoVenda pedido = PedidoVenda.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .cliente(orc.getCliente())
                .orcamento(orc)
                .numero(orc.getNumero())
                .status("ABERTO")
                .descricao(orc.getDescricao() != null
                        ? orc.getDescricao()
                        : "Pedido gerado do Orçamento " + orc.getNumero())
                .observacoes(orc.getObservacoes())
                .formaPagamento(formaPag)
                .numParcelas(orc.getNumParcelas())
                .intervaloDias(orc.getIntervaloDias())
                .primeiroVencimento(java.time.LocalDate.now().plusDays(30))
                .criadoPor(usuario)
                .build();

        adicionarItens(pedido, itensReq);
        pedido.recalcularTotal();

        PedidoVenda salvo = pedidoVendaRepository.save(pedido);

        orc.setStatus("EM_PEDIDO");
        orc.setAlteradoPor(usuario);
        orcamentoService.salvarEntidade(orc);

        log.info("Pedido {} gerado do Orçamento {}", salvo.getNumero(), orc.getNumero());
        return PedidoVendaResponse.from(salvo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers internos
    // ─────────────────────────────────────────────────────────────────────────

    private PedidoVenda buscarEntidade(Usuario usuario, UUID id) {
        return pedidoVendaRepository.findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Pedido de venda não encontrado: " + id));
    }

    private void adicionarItens(PedidoVenda pedido, List<ItemRequest> itens) {
        AtomicInteger ordem = new AtomicInteger(0);
        itens.forEach(itemReq -> {
            ItemPedidoVenda item = ItemPedidoVenda.builder()
                    .pedido(pedido)
                    .descricao(itemReq.descricao().trim())
                    .quantidade(itemReq.quantidade())
                    .valorUnitario(itemReq.valorUnitario())
                    .desconto(itemReq.desconto() != null ? itemReq.desconto() : BigDecimal.ZERO)
                    .ordem(itemReq.ordem() != null ? itemReq.ordem() : ordem.getAndIncrement())
                    .build();
            item.calcularSubtotal();
            pedido.getItens().add(item);
        });
    }

    private String gerarNumero(java.util.UUID empresaId) {
        long seq = numeradorService.proximoNumero(empresaId, "PV");
        return String.format("PV-%05d", seq);
    }
}
