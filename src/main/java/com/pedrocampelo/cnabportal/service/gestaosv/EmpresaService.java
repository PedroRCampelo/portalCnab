package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaResponse;
import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaUpdateRequest;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.NoSuchElementException;

/**
 * Service de gestão da empresa (tenant) do MEI.
 *
 * Diferente de outras entidades, MEI só gerencia A SUA própria empresa
 * (a que ele está logado). Não há criação/exclusão via UI.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmpresaService {

    private final EmpresaRepository empresaRepository;

    // Valores padrão de DAS por categoria (jan/2025)
    private static final BigDecimal DAS_COMERCIO_INDUSTRIA = new BigDecimal("76.90");
    private static final BigDecimal DAS_SERVICOS           = new BigDecimal("80.90");
    private static final BigDecimal DAS_AMBOS              = new BigDecimal("81.90");

    /**
     * Retorna dados da empresa do MEI logado.
     *
     * @Transactional(readOnly = true) garante que a sessão Hibernate fica aberta
     * durante o acesso ao proxy lazy de usuario.getEmpresa().
     */
    @Transactional(readOnly = true)
    public EmpresaResponse buscarMinha(Usuario usuario) {
        Empresa empresa = empresaRepository.findById(usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Empresa não encontrada"));
        return EmpresaResponse.from(empresa, valorDasEfetivo(empresa));
    }

    /**
     * Atualiza dados editáveis da empresa.
     *
     * Campos editáveis:
     *   - nome (mas não CNPJ — é PK lógica)
     *   - limiteAnualMei
     *   - dasAtivo, dasCategoria, dasValorMensal
     *
     * IMPORTANTE: este método NÃO gera DAS automaticamente quando dasAtivo
     * vira true. A geração é responsabilidade do DasService (Sprint 2.2-C).
     */
    @Transactional
    public EmpresaResponse atualizarMinha(Usuario usuario, EmpresaUpdateRequest request) {
        Empresa empresa = empresaRepository.findById(usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Empresa não encontrada"));

        // Validações
        if (request.nome() != null && !request.nome().isBlank()) {
            empresa.setNome(request.nome().trim());
        }

        if (request.limiteAnualMei() != null) {
            if (request.limiteAnualMei().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Limite anual MEI deve ser maior que zero");
            }
            empresa.setLimiteAnualMei(request.limiteAnualMei());
        }

        // DAS — toggle e categoria
        if (request.dasAtivo() != null) {
            boolean novoDasAtivo = request.dasAtivo();

            if (novoDasAtivo) {
                // Ao ativar, exige categoria
                String cat = request.dasCategoria();
                if (cat == null || cat.isBlank()) {
                    throw new IllegalArgumentException(
                            "Categoria do DAS é obrigatória ao ativar o controle (COMERCIO_INDUSTRIA, SERVICOS ou AMBOS)"
                    );
                }
                if (!isCategoriaValida(cat)) {
                    throw new IllegalArgumentException(
                            "Categoria DAS inválida. Use COMERCIO_INDUSTRIA, SERVICOS ou AMBOS"
                    );
                }
                empresa.setDasAtivo(true);
                empresa.setDasCategoria(cat);
            } else {
                // Ao desativar, mantém categoria/valor pra histórico (não apaga)
                empresa.setDasAtivo(false);
            }
        } else if (request.dasCategoria() != null) {
            // Mudança de categoria sem mexer no toggle
            if (!isCategoriaValida(request.dasCategoria())) {
                throw new IllegalArgumentException("Categoria DAS inválida");
            }
            empresa.setDasCategoria(request.dasCategoria());
        }

        // Valor manual (override) — pode ser null pra voltar ao padrão da categoria
        if (request.dasValorMensalEditado() != null && request.dasValorMensalEditado()) {
            empresa.setDasValorMensal(request.dasValorMensal()); // pode ser null
        }

        Empresa salva = empresaRepository.save(empresa);
        log.info("Empresa atualizada: {} (dasAtivo={}, categoria={}, limite={})",
                salva.getId(), salva.getDasAtivo(), salva.getDasCategoria(), salva.getLimiteAnualMei());

        return EmpresaResponse.from(salva, valorDasEfetivo(salva));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calcula o valor efetivo do DAS:
     *   - Se MEI definiu valor manual (dasValorMensal != null) → usa esse
     *   - Senão → usa padrão da categoria
     *   - Se DAS desativado → null
     */
    public BigDecimal valorDasEfetivo(Empresa empresa) {
        if (!Boolean.TRUE.equals(empresa.getDasAtivo())) return null;
        if (empresa.getDasValorMensal() != null) return empresa.getDasValorMensal();
        return valorPadraoCategoria(empresa.getDasCategoria());
    }

    public BigDecimal valorPadraoCategoria(String categoria) {
        if (categoria == null) return null;
        return switch (categoria) {
            case "COMERCIO_INDUSTRIA" -> DAS_COMERCIO_INDUSTRIA;
            case "SERVICOS"           -> DAS_SERVICOS;
            case "AMBOS"              -> DAS_AMBOS;
            default                   -> null;
        };
    }

    private boolean isCategoriaValida(String cat) {
        return "COMERCIO_INDUSTRIA".equals(cat)
                || "SERVICOS".equals(cat)
                || "AMBOS".equals(cat);
    }
}