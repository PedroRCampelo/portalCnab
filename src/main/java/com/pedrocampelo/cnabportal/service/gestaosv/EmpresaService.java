package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaResponse;
import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaUpdateRequest;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import com.pedrocampelo.cnabportal.util.CnpjValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.NoSuchElementException;
import java.util.Optional;

/**
 * Service de gestão da empresa (tenant) do MEI.
 *
 * Sprint 2.2-A1.3: validação de CNPJ + regra de imutabilidade
 *   - CNPJ pode ser cadastrado livremente (1ª vez)
 *   - Depois de cadastrado, NÃO pode ser alterado pelo MEI
 *     (evita quebrar boletos/notas com CNPJ trocado)
 *   - Bloqueia duplicidade: 1 CNPJ = 1 Empresa
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmpresaService {

    private final EmpresaRepository empresaRepository;

    // Valores padrão de DAS por categoria
    private static final BigDecimal DAS_COMERCIO_INDUSTRIA = new BigDecimal("76.90");
    private static final BigDecimal DAS_SERVICOS           = new BigDecimal("80.90");
    private static final BigDecimal DAS_AMBOS              = new BigDecimal("81.90");

    @Transactional(readOnly = true)
    public EmpresaResponse buscarMinha(Usuario usuario) {
        Empresa empresa = empresaRepository.findById(usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Empresa não encontrada"));
        return EmpresaResponse.from(empresa, valorDasEfetivo(empresa));
    }

    @Transactional
    public EmpresaResponse atualizarMinha(Usuario usuario, EmpresaUpdateRequest request) {
        Empresa empresa = empresaRepository.findById(usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Empresa não encontrada"));

        // ── Nome ──────────────────────────────────────────────────────────────
        if (request.nome() != null && !request.nome().isBlank()) {
            empresa.setNome(request.nome().trim());
        }

        // ── CNPJ ──────────────────────────────────────────────────────────────
        if (request.cnpj() != null) {
            String cnpjLimpo = CnpjValidator.apenasDigitos(request.cnpj());

            if (cnpjLimpo.isEmpty()) {
                // MEI mandou CNPJ vazio explicitamente
                if (empresa.getCnpj() != null) {
                    throw new IllegalArgumentException(
                            "CNPJ não pode ser removido. Para alterar, entre em contato com o suporte."
                    );
                }
                // Se já era null, ignora (sem mudança)
            } else {
                // Tem CNPJ pra validar/salvar
                String cnpjFormatado;
                try {
                    cnpjFormatado = CnpjValidator.normalizar(cnpjLimpo);
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("CNPJ inválido: " + e.getMessage());
                }

                // REGRA: se empresa já tem CNPJ, NÃO permite mudar
                if (empresa.getCnpj() != null && !empresa.getCnpj().equals(cnpjFormatado)) {
                    throw new IllegalArgumentException(
                            "CNPJ já cadastrado não pode ser alterado. " +
                                    "Para correção, entre em contato com o suporte."
                    );
                }

                // 1ª vez cadastrando OU mesmo CNPJ (idempotente)
                if (empresa.getCnpj() == null) {
                    // Verifica duplicidade SÓ na primeira vez
                    Optional<Empresa> existente = empresaRepository.findByCnpj(cnpjFormatado);
                    if (existente.isPresent() && !existente.get().getId().equals(empresa.getId())) {
                        throw new IllegalArgumentException(
                                "Este CNPJ já está cadastrado em outra conta do Whallet."
                        );
                    }
                    empresa.setCnpj(cnpjFormatado);
                    log.info("CNPJ cadastrado para empresa {}: {}", empresa.getId(), cnpjFormatado);
                }
            }
        }

        // ── Limite anual MEI ──────────────────────────────────────────────────
        if (request.limiteAnualMei() != null) {
            if (request.limiteAnualMei().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Limite anual MEI deve ser maior que zero");
            }
            empresa.setLimiteAnualMei(request.limiteAnualMei());
        }

        // ── DAS — toggle e categoria ──────────────────────────────────────────
        if (request.dasAtivo() != null) {
            boolean novoDasAtivo = request.dasAtivo();

            if (novoDasAtivo) {
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
                empresa.setDasAtivo(false);
            }
        } else if (request.dasCategoria() != null) {
            if (!isCategoriaValida(request.dasCategoria())) {
                throw new IllegalArgumentException("Categoria DAS inválida");
            }
            empresa.setDasCategoria(request.dasCategoria());
        }

        // ── Valor DAS manual ──────────────────────────────────────────────────
        if (request.dasValorMensalEditado() != null && request.dasValorMensalEditado()) {
            empresa.setDasValorMensal(request.dasValorMensal());
        }

        Empresa salva = empresaRepository.save(empresa);
        log.info("Empresa atualizada: {} (cnpj={}, dasAtivo={}, limite={})",
                salva.getId(), salva.getCnpj(), salva.getDasAtivo(), salva.getLimiteAnualMei());

        return EmpresaResponse.from(salva, valorDasEfetivo(salva));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

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