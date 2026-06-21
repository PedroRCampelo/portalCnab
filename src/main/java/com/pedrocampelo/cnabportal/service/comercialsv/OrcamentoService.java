package com.pedrocampelo.cnabportal.service.comercialsv;

import com.pedrocampelo.cnabportal.dto.ItemRequest;
import com.pedrocampelo.cnabportal.dto.OrcamentoRequest;
import com.pedrocampelo.cnabportal.dto.OrcamentoResponse;
import com.pedrocampelo.cnabportal.model.Cliente;
import com.pedrocampelo.cnabportal.model.ItemOrcamento;
import com.pedrocampelo.cnabportal.model.Orcamento;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.OrcamentoRepository;
import com.pedrocampelo.cnabportal.service.NumeradorEmpresaService;
import com.pedrocampelo.cnabportal.service.recebimentossv.ClienteService;
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
public class OrcamentoService {

    private final OrcamentoRepository    orcamentoRepository;
    private final ClienteService          clienteService;
    private final NumeradorEmpresaService numeradorService;

    // ─────────────────────────────────────────────────────────────────────────
    // Listagem
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<OrcamentoResponse> listar(Usuario usuario, String status, UUID clienteId,
                                          int pagina, int tamanho) {
        UUID empresaId = usuario.getEmpresa().getId();
        var pageable = PageRequest.of(pagina, Math.min(tamanho, 100),
                Sort.by("criadoEm").descending());

        Page<Orcamento> page;
        if (clienteId != null) {
            page = orcamentoRepository.findByEmpresaIdAndClienteId(empresaId, clienteId, pageable);
        } else if (status != null && !status.isBlank()) {
            page = orcamentoRepository.findByEmpresaIdAndStatus(empresaId, status.toUpperCase(), pageable);
        } else {
            page = orcamentoRepository.findByEmpresaId(empresaId, pageable);
        }

        return page.map(OrcamentoResponse::from);
    }

    @Transactional(readOnly = true)
    public OrcamentoResponse buscarPorId(Usuario usuario, UUID id) {
        return OrcamentoResponse.from(buscarEntidade(usuario, id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public OrcamentoResponse criar(Usuario usuario, OrcamentoRequest req) {
        Cliente cliente = clienteService.buscarEntidadePorId(usuario, req.clienteId());

        Orcamento orc = Orcamento.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .cliente(cliente)
                .numero(gerarNumero(usuario.getEmpresa().getId()))
                .status("RASCUNHO")
                .dataEmissao(req.dataEmissao() != null ? req.dataEmissao() : java.time.LocalDate.now())
                .validade(req.validade())
                .descricao(req.descricao().trim())
                .observacoes(req.observacoes())
                .descontoGeral(req.descontoGeral() != null ? req.descontoGeral() : BigDecimal.ZERO)
                .valorFrete(req.valorFrete() != null ? req.valorFrete() : BigDecimal.ZERO)
                .prazoEntrega(req.prazoEntrega())
                .formaPagamento(req.formaPagamento() != null ? req.formaPagamento() : "A_DEFINIR")
                .numParcelas(req.numParcelas() != null ? req.numParcelas() : 1)
                .intervaloDias(req.intervaloDias() != null ? req.intervaloDias() : 30)
                .criadoPor(usuario)
                .build();

        adicionarItens(orc, req.itens());
        orc.recalcularTotal();

        Orcamento salvo = orcamentoRepository.save(orc);
        log.info("Orçamento criado: {} número={}", salvo.getId(), salvo.getNumero());
        return OrcamentoResponse.from(salvo);
    }

    @Transactional
    public OrcamentoResponse atualizar(Usuario usuario, UUID id, OrcamentoRequest req) {
        Orcamento orc = buscarEntidade(usuario, id);

        if (!orc.isEditavel()) {
            throw new IllegalStateException("Orçamento " + orc.getNumero() + " não pode ser editado no status " + orc.getStatus());
        }

        Cliente cliente = clienteService.buscarEntidadePorId(usuario, req.clienteId());
        orc.setCliente(cliente);
        if (req.dataEmissao() != null) orc.setDataEmissao(req.dataEmissao());
        orc.setValidade(req.validade());
        orc.setDescricao(req.descricao().trim());
        orc.setObservacoes(req.observacoes());
        orc.setDescontoGeral(req.descontoGeral() != null ? req.descontoGeral() : BigDecimal.ZERO);
        orc.setValorFrete(req.valorFrete() != null ? req.valorFrete() : BigDecimal.ZERO);
        orc.setPrazoEntrega(req.prazoEntrega());
        orc.setFormaPagamento(req.formaPagamento() != null ? req.formaPagamento() : "A_DEFINIR");
        orc.setNumParcelas(req.numParcelas() != null ? req.numParcelas() : 1);
        orc.setIntervaloDias(req.intervaloDias() != null ? req.intervaloDias() : 30);
        orc.setStatus("RASCUNHO");
        orc.setAprovadoEm(null);
        orc.setAlteradoPor(usuario);

        orc.getItens().clear();
        adicionarItens(orc, req.itens());
        orc.recalcularTotal();

        return OrcamentoResponse.from(orcamentoRepository.save(orc));
    }

    @Transactional
    public OrcamentoResponse mudarStatus(Usuario usuario, UUID id, String novoStatus) {
        Orcamento orc = buscarEntidade(usuario, id);

        if (orc.isEmPedido()) {
            throw new IllegalStateException("Orçamento " + orc.getNumero() + " já foi convertido em pedido e não pode ser alterado.");
        }

        switch (novoStatus.toUpperCase()) {
            case "RASCUNHO" -> orc.setStatus("RASCUNHO");
            case "ENVIADO"  -> orc.setStatus("ENVIADO");
            case "APROVADO" -> { orc.setStatus("APROVADO"); orc.setAprovadoEm(LocalDateTime.now()); }
            case "RECUSADO" -> orc.setStatus("RECUSADO");
            default -> throw new IllegalArgumentException("Status inválido: " + novoStatus);
        }

        orc.setAlteradoPor(usuario);
        return OrcamentoResponse.from(orcamentoRepository.save(orc));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers internos
    // ─────────────────────────────────────────────────────────────────────────

    public Orcamento buscarEntidade(Usuario usuario, UUID id) {
        return orcamentoRepository.findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Orçamento não encontrado: " + id));
    }

    public Orcamento salvarEntidade(Orcamento orc) {
        return orcamentoRepository.save(orc);
    }

    private void adicionarItens(Orcamento orc, List<ItemRequest> itens) {
        AtomicInteger ordem = new AtomicInteger(0);
        itens.forEach(itemReq -> {
            ItemOrcamento item = ItemOrcamento.builder()
                    .orcamento(orc)
                    .descricao(itemReq.descricao().trim())
                    .quantidade(itemReq.quantidade())
                    .valorUnitario(itemReq.valorUnitario())
                    .desconto(itemReq.desconto() != null ? itemReq.desconto() : BigDecimal.ZERO)
                    .ordem(itemReq.ordem() != null ? itemReq.ordem() : ordem.getAndIncrement())
                    .build();
            item.calcularSubtotal();
            orc.getItens().add(item);
        });
    }

    private String gerarNumero(java.util.UUID empresaId) {
        long seq = numeradorService.proximoNumero(empresaId, "ORC");
        return String.format("ORC-%05d", seq);
    }
}
