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

    public Page<ClienteResponse> listar(Usuario usuario, int pagina, int tamanho) {
        return clienteRepository.findByEmpresaIdAndAtivoTrue(
                usuario.getEmpresa().getId(),
                PageRequest.of(pagina, Math.min(tamanho, 100), Sort.by("nome").ascending())
        ).map(ClienteResponse::from);
    }

    public List<ClienteResponse> buscarPorNome(Usuario usuario, String termo) {
        if (termo == null || termo.isBlank()) {
            return clienteRepository.findByEmpresaIdAndAtivoTrueOrderByNomeAsc(
                    usuario.getEmpresa().getId()
            ).stream().limit(10).map(ClienteResponse::from).toList();
        }
        return clienteRepository.buscarPorNome(usuario.getEmpresa().getId(), termo.trim())
                .stream().limit(20).map(ClienteResponse::from).toList();
    }

    public ClienteResponse buscarPorId(Usuario usuario, UUID id) {
        Cliente cliente = clienteRepository
                .findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado"));
        return ClienteResponse.from(cliente, calcularEstatisticas(cliente));
    }

    private ClienteResponse.Estatisticas calcularEstatisticas(Cliente cliente) {
        long total     = recebimentoRepository.countByClienteId(cliente.getId());
        long atrasados = recebimentoRepository.countByClienteIdAndStatus(cliente.getId(), "ATRASADO");
        long pagos     = recebimentoRepository.countByClienteIdAndStatus(cliente.getId(), "RECEBIDO");
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
        return new ClienteResponse.Estatisticas(total, atrasados, pagos, totalRecebido, totalAtrasado, calcularScore(total, atrasados, pagos));
    }

    private String calcularScore(long total, long atrasados, long pagos) {
        if (total == 0) return "BOM";
        if (atrasados >= 3) return "INADIMPLENTE";
        if (atrasados == 0 && (double) pagos / total >= 0.8) return "BOM";
        if (atrasados >= 1 && atrasados <= 2) return "ATENCAO";
        if ((double) pagos / total < 0.5) return "INADIMPLENTE";
        return "ATENCAO";
    }

    @Transactional
    public ClienteResponse criar(Usuario usuario, ClienteRequest request) {
        Empresa empresa = usuario.getEmpresa();
        String docNormalizado = norm(request.documento());

        if (docNormalizado != null) {
            clienteRepository.findByEmpresaIdAndDocumentoAndAtivoTrue(empresa.getId(), docNormalizado)
                    .ifPresent(existente -> {
                        throw new IllegalArgumentException("Já existe um cliente com este CPF/CNPJ: " + existente.getNome());
                    });
        }

        Cliente novo = Cliente.builder()
                .empresa(empresa)
                .nome(request.nome().trim())
                .documento(docNormalizado)
                .tipoPessoa(request.tipoPessoa() != null ? request.tipoPessoa() : "PF")
                .dataNascimento(request.dataNascimento())
                .email(normEmail(request.email()))
                .telefone(normTel(request.telefone()))
                .whatsapp(normTel(request.whatsapp()))
                .telefone2(normTel(request.telefone2()))
                .endereco(request.endereco())
                .cidade(request.cidade())
                .estado(request.estado())
                .cep(normCep(request.cep()))
                .origemLead(request.origemLead())
                .responsavel(request.responsavel())
                .tags(request.tags())
                .categoria(request.categoria())
                .notas(request.notas())
                .setorId(request.setorId())
                .ativo(true)
                .build();

        Cliente salvo = clienteRepository.save(novo);
        log.info("Cliente criado: {} (empresa={}, setor={})", salvo.getNome(), empresa.getId(), salvo.getSetorId());
        return ClienteResponse.from(salvo);
    }

    @Transactional
    public ClienteResponse atualizar(Usuario usuario, UUID id, ClienteRequest request) {
        Cliente c = clienteRepository.findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado"));

        c.setNome(request.nome().trim());
        c.setDocumento(norm(request.documento()));
        if (request.tipoPessoa() != null) c.setTipoPessoa(request.tipoPessoa());
        c.setDataNascimento(request.dataNascimento());
        c.setEmail(normEmail(request.email()));
        c.setTelefone(normTel(request.telefone()));
        c.setWhatsapp(normTel(request.whatsapp()));
        c.setTelefone2(normTel(request.telefone2()));
        c.setEndereco(request.endereco());
        c.setCidade(request.cidade());
        c.setEstado(request.estado());
        c.setCep(normCep(request.cep()));
        c.setOrigemLead(request.origemLead());
        c.setResponsavel(request.responsavel());
        c.setTags(request.tags());
        c.setCategoria(request.categoria());
        c.setNotas(request.notas());
        c.setSetorId(request.setorId());

        Cliente salvo = clienteRepository.save(c);
        log.info("Cliente atualizado: {} (setor={})", salvo.getId(), salvo.getSetorId());
        return ClienteResponse.from(salvo);
    }

    @Transactional
    public void inativar(Usuario usuario, UUID id) {
        Cliente c = clienteRepository.findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado"));
        c.setAtivo(false);
        clienteRepository.save(c);
        log.info("Cliente inativado: {}", id);
    }

    private String norm(String doc) { if (doc == null || doc.isBlank()) return null; String d = doc.replaceAll("\\D", ""); return d.isBlank() ? null : d; }
    private String normTel(String t) { if (t == null || t.isBlank()) return null; return t.replaceAll("\\D", ""); }
    private String normEmail(String e) { if (e == null || e.isBlank()) return null; return e.trim().toLowerCase(); }
    private String normCep(String c) { if (c == null || c.isBlank()) return null; return c.replaceAll("\\D", ""); }

    public Cliente buscarEntidadePorId(Usuario usuario, UUID id) {
        return clienteRepository.findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado"));
    }
}