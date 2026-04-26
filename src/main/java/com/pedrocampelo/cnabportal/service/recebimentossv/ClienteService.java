package com.pedrocampelo.cnabportal.service.recebimentossv;

import com.pedrocampelo.cnabportal.dto.ClienteRequest;
import com.pedrocampelo.cnabportal.dto.ClienteResponse;
import com.pedrocampelo.cnabportal.model.Cliente;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.ClienteRepository;
import com.pedrocampelo.cnabportal.repository.RecebimentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final RecebimentoRepository recebimentoRepository;

    // ── Listagem paginada ─────────────────────────────────────────────────────

    public Page<ClienteResponse> listar(Usuario usuario, int pagina, int tamanho) {
        Page<Cliente> page = clienteRepository.findByEmpresaIdAndAtivoTrue(
                usuario.getEmpresa().getId(),
                PageRequest.of(pagina, Math.min(tamanho, 100), Sort.by("nome").ascending())
        );
        return page.map(ClienteResponse::from);
    }

    // ── Autocomplete (criação rápida de recebimento) ──────────────────────────

    public List<ClienteResponse> buscarPorNome(Usuario usuario, String termo) {
        if (termo == null || termo.isBlank()) {
            return clienteRepository.findByEmpresaIdAndAtivoTrueOrderByNomeAsc(
                    usuario.getEmpresa().getId()
            ).stream().limit(10).map(ClienteResponse::from).toList();
        }
        return clienteRepository.buscarPorNome(usuario.getEmpresa().getId(), termo.trim())
                .stream().limit(20).map(ClienteResponse::from).toList();
    }

    // ── Detalhe (com estatísticas) ────────────────────────────────────────────

    public ClienteResponse buscarPorId(Usuario usuario, UUID id) {
        Cliente cliente = clienteRepository
                .findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado"));

        return ClienteResponse.from(cliente, calcularEstatisticas(cliente));
    }

    /**
     * Score do cliente — calculado on-demand (não armazenado).
     *
     * Lógica simples (V1):
     *   - BOM: 0 atrasos OU >= 80% pagos no prazo
     *   - ATENCAO: 1-2 atrasos
     *   - INADIMPLENTE: 3+ atrasos OU < 50% pagos
     */
    private ClienteResponse.Estatisticas calcularEstatisticas(Cliente cliente) {
        long total       = recebimentoRepository.countByClienteId(cliente.getId());
        long atrasados   = recebimentoRepository.countByClienteIdAndStatus(cliente.getId(), "ATRASADO");
        long pagos       = recebimentoRepository.countByClienteIdAndStatus(cliente.getId(), "RECEBIDO");

        // Soma valores recebidos e em atraso
        // (poderia ser uma query SQL otimizada, mas pra V1 fazemos em Java)
        BigDecimal totalRecebido = BigDecimal.ZERO;
        BigDecimal totalAtrasado = BigDecimal.ZERO;
        var recebimentos = recebimentoRepository.findByClienteIdOrderByDataVencimentoDesc(cliente.getId());
        for (var r : recebimentos) {
            if ("RECEBIDO".equals(r.getStatus()) || "PARCIAL".equals(r.getStatus())) {
                totalRecebido = totalRecebido.add(r.getValorRecebido());
            }
            if ("ATRASADO".equals(r.getStatus())) {
                totalAtrasado = totalAtrasado.add(r.getSaldoPendente());
            }
        }

        String score = calcularScore(total, atrasados, pagos);

        return new ClienteResponse.Estatisticas(
                total, atrasados, pagos,
                totalRecebido, totalAtrasado, score
        );
    }

    private String calcularScore(long total, long atrasados, long pagos) {
        if (total == 0) return "BOM";  // cliente novo, benefício da dúvida
        if (atrasados >= 3) return "INADIMPLENTE";
        if (atrasados == 0 && (double) pagos / total >= 0.8) return "BOM";
        if (atrasados >= 1 && atrasados <= 2) return "ATENCAO";
        if ((double) pagos / total < 0.5) return "INADIMPLENTE";
        return "ATENCAO";
    }

    // ── Criação ───────────────────────────────────────────────────────────────

    @Transactional
    public ClienteResponse criar(Usuario usuario, ClienteRequest request) {
        Empresa empresa = usuario.getEmpresa();
        String docNormalizado = normalizarDocumento(request.documento());

        // Anti-duplicata (se documento informado)
        if (docNormalizado != null) {
            clienteRepository.findByEmpresaIdAndDocumento(empresa.getId(), docNormalizado)
                    .ifPresent(existente -> {
                        throw new IllegalArgumentException(
                                "Já existe um cliente com este CPF/CNPJ: " + existente.getNome()
                        );
                    });
        }

        Cliente novo = Cliente.builder()
                .empresa(empresa)
                .nome(request.nome().trim())
                .documento(docNormalizado)
                .tipoPessoa(request.tipoPessoa() != null ? request.tipoPessoa() : "PF")
                .email(normalizarEmail(request.email()))
                .telefone(normalizarTelefone(request.telefone()))
                .categoria(request.categoria())
                .notas(request.notas())
                .ativo(true)
                .build();

        Cliente salvo = clienteRepository.save(novo);
        log.info("Cliente criado: {} (empresa={})", salvo.getNome(), empresa.getId());
        return ClienteResponse.from(salvo);
    }

    // ── Edição ────────────────────────────────────────────────────────────────

    @Transactional
    public ClienteResponse atualizar(Usuario usuario, UUID id, ClienteRequest request) {
        Cliente cliente = clienteRepository
                .findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado"));

        cliente.setNome(request.nome().trim());
        cliente.setDocumento(normalizarDocumento(request.documento()));
        if (request.tipoPessoa() != null) cliente.setTipoPessoa(request.tipoPessoa());
        cliente.setEmail(normalizarEmail(request.email()));
        cliente.setTelefone(normalizarTelefone(request.telefone()));
        cliente.setCategoria(request.categoria());
        cliente.setNotas(request.notas());

        Cliente salvo = clienteRepository.save(cliente);
        log.info("Cliente atualizado: {}", salvo.getId());
        return ClienteResponse.from(salvo);
    }

    // ── Inativação (soft delete) ──────────────────────────────────────────────

    @Transactional
    public void inativar(Usuario usuario, UUID id) {
        Cliente cliente = clienteRepository
                .findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado"));

        cliente.setAtivo(false);
        clienteRepository.save(cliente);
        log.info("Cliente inativado: {}", id);
    }

    // ── Helpers de normalização ───────────────────────────────────────────────

    private String normalizarDocumento(String doc) {
        if (doc == null || doc.isBlank()) return null;
        String digitos = doc.replaceAll("\\D", "");
        return digitos.isBlank() ? null : digitos;
    }

    private String normalizarTelefone(String tel) {
        if (tel == null || tel.isBlank()) return null;
        return tel.replaceAll("\\D", "");
    }

    private String normalizarEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return email.trim().toLowerCase();
    }

    // ── Buscar entidade (uso interno por outros services) ─────────────────────

    public Cliente buscarEntidadePorId(Usuario usuario, UUID id) {
        return clienteRepository
                .findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado"));
    }
}