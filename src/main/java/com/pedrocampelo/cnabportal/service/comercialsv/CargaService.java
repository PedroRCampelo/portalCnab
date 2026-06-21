package com.pedrocampelo.cnabportal.service.comercialsv;

import com.pedrocampelo.cnabportal.dto.CargaRequest;
import com.pedrocampelo.cnabportal.dto.CargaResponse;
import com.pedrocampelo.cnabportal.model.Carga;
import com.pedrocampelo.cnabportal.model.PedidoVenda;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.CargaRepository;
import com.pedrocampelo.cnabportal.repository.PedidoVendaRepository;
import com.pedrocampelo.cnabportal.service.NumeradorEmpresaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class CargaService {

    private final CargaRepository        cargaRepository;
    private final PedidoVendaRepository  pedidoVendaRepository;
    private final NumeradorEmpresaService numeradorService;

    // ─── Criar ──────────────────────────────────────────────────────────────────

    public CargaResponse criar(Usuario usuario, CargaRequest req) {
        long seq = numeradorService.proximoNumero(usuario.getEmpresa().getId(), "CRG");
        String numero = String.format("CRG-%05d", seq);

        Carga carga = Carga.builder()
                .empresa(usuario.getEmpresa())
                .numero(numero)
                .descricao(req.descricao())
                .enderecoOrigem(req.enderecoOrigem())
                .status("ABERTA")
                .build();

        return CargaResponse.from(cargaRepository.save(carga));
    }

    // ─── Listar ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<CargaResponse> listar(Usuario usuario, String status, int pagina, int tamanho) {
        var pageable = PageRequest.of(pagina, tamanho, Sort.by("criadoEm").descending());
        UUID empresaId = usuario.getEmpresa().getId();

        Page<Carga> page = status != null && !status.isBlank()
                ? cargaRepository.findByEmpresaIdAndStatus(empresaId, status, pageable)
                : cargaRepository.findByEmpresaId(empresaId, pageable);

        return page.map(CargaResponse::from);
    }

    // ─── Buscar por ID ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CargaResponse buscarPorId(Usuario usuario, UUID id) {
        return CargaResponse.from(cargaOuErro(id, usuario.getEmpresa().getId()));
    }

    // ─── Adicionar pedido ────────────────────────────────────────────────────────

    public CargaResponse adicionarPedido(Usuario usuario, UUID cargaId, UUID pedidoId, String enderecoEntrega) {
        UUID empresaId = usuario.getEmpresa().getId();
        Carga carga = cargaOuErro(cargaId, empresaId);

        if ("FINALIZADA".equals(carga.getStatus())) {
            throw new IllegalStateException("Não é possível modificar uma carga finalizada.");
        }

        PedidoVenda pedido = pedidoVendaRepository.findByIdAndEmpresaId(pedidoId, empresaId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado."));

        if (pedido.getCarga() != null) {
            throw new IllegalStateException("Pedido " + pedido.getNumero() + " já está em outra carga (" + pedido.getCarga().getNumero() + ").");
        }
        if ("EFETIVADO".equals(pedido.getStatus()) || "CANCELADO".equals(pedido.getStatus())) {
            throw new IllegalStateException("Pedido " + pedido.getNumero() + " não pode ser adicionado (status: " + pedido.getStatus() + ").");
        }

        pedido.setCarga(carga);
        pedido.setStatus("EM_CARGA");
        if (enderecoEntrega != null && !enderecoEntrega.isBlank()) {
            pedido.setEnderecoEntrega(enderecoEntrega.trim());
        }
        pedidoVendaRepository.save(pedido);

        return buscarPorId(usuario, cargaId);
    }

    // ─── Remover pedido ──────────────────────────────────────────────────────────

    public CargaResponse removerPedido(Usuario usuario, UUID cargaId, UUID pedidoId) {
        UUID empresaId = usuario.getEmpresa().getId();
        Carga carga = cargaOuErro(cargaId, empresaId);

        if ("FINALIZADA".equals(carga.getStatus())) {
            throw new IllegalStateException("Não é possível modificar uma carga finalizada.");
        }

        PedidoVenda pedido = pedidoVendaRepository.findByIdAndEmpresaId(pedidoId, empresaId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado."));

        if (pedido.getCarga() == null || !pedido.getCarga().getId().equals(cargaId)) {
            throw new IllegalStateException("Pedido não pertence a esta carga.");
        }

        pedido.setCarga(null);
        pedido.setStatus("ABERTO");
        pedidoVendaRepository.save(pedido);

        return buscarPorId(usuario, cargaId);
    }

    // ─── Atualizar endereço de entrega de um pedido na carga ─────────────────────

    public CargaResponse atualizarEndereco(Usuario usuario, UUID cargaId, UUID pedidoId, String enderecoEntrega) {
        UUID empresaId = usuario.getEmpresa().getId();
        cargaOuErro(cargaId, empresaId);

        PedidoVenda pedido = pedidoVendaRepository.findByIdAndEmpresaId(pedidoId, empresaId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado."));

        if (pedido.getCarga() == null || !pedido.getCarga().getId().equals(cargaId)) {
            throw new IllegalStateException("Pedido não pertence a esta carga.");
        }

        pedido.setEnderecoEntrega(enderecoEntrega != null ? enderecoEntrega.trim() : null);
        pedidoVendaRepository.save(pedido);

        return buscarPorId(usuario, cargaId);
    }

    // ─── Finalizar carga ─────────────────────────────────────────────────────────

    public CargaResponse finalizar(Usuario usuario, UUID cargaId) {
        UUID empresaId = usuario.getEmpresa().getId();
        Carga carga = cargaOuErro(cargaId, empresaId);

        if ("FINALIZADA".equals(carga.getStatus())) {
            throw new IllegalStateException("Carga já está finalizada.");
        }
        if (carga.getPedidos().isEmpty()) {
            throw new IllegalStateException("Não é possível finalizar uma carga sem pedidos.");
        }

        carga.setStatus("FINALIZADA");
        return CargaResponse.from(cargaRepository.save(carga));
    }

    // ─── Reabrir carga ───────────────────────────────────────────────────────────

    public CargaResponse reabrir(Usuario usuario, UUID cargaId) {
        UUID empresaId = usuario.getEmpresa().getId();
        Carga carga = cargaOuErro(cargaId, empresaId);

        if (!"FINALIZADA".equals(carga.getStatus())) {
            throw new IllegalStateException("Carga não está finalizada.");
        }

        carga.setStatus("ABERTA");
        return CargaResponse.from(cargaRepository.save(carga));
    }

    // ─── Gerar JSON de roteirização ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> gerarJsonRoteirizacao(Usuario usuario, UUID cargaId) {
        Carga carga = cargaOuErro(cargaId, usuario.getEmpresa().getId());

        List<Map<String, String>> stops = carga.getPedidos().stream()
                .filter(p -> p.getEnderecoEntrega() != null && !p.getEnderecoEntrega().isBlank())
                .map(p -> {
                    Map<String, String> stop = new LinkedHashMap<>();
                    stop.put("id", p.getNumero());
                    stop.put("address", p.getEnderecoEntrega());
                    return stop;
                })
                .toList();

        Map<String, Object> json = new LinkedHashMap<>();

        Map<String, String> origin = new LinkedHashMap<>();
        origin.put("id", "DC");
        origin.put("address", carga.getEnderecoOrigem() != null ? carga.getEnderecoOrigem() : "");
        json.put("origin", origin);
        json.put("stops", stops);

        return json;
    }

    // ─── Helper ─────────────────────────────────────────────────────────────────

    private Carga cargaOuErro(UUID id, UUID empresaId) {
        return cargaRepository.findByIdAndEmpresaIdWithPedidos(id, empresaId)
                .orElseThrow(() -> new NoSuchElementException("Carga não encontrada."));
    }
}
