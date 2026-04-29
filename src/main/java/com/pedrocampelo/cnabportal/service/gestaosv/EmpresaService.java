package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaResponse;
import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaUpdateRequest;
import com.pedrocampelo.cnabportal.model.CategoriaMei;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.RegimeTributario;
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
 * Sprint 2.2-A1.5: refatorado pra regime tributário escalável.
 *
 * Regras por regime:
 *   - NENHUM            → só nome + CNPJ; sem limite, sem DAS
 *   - MEI               → limite=81000 sugerido, DAS opcional, categoria obrigatória se DAS ativo
 *   - SIMPLES_NACIONAL  → limite=360000/4800000 (futuro)
 *   - LUCRO_PRESUMIDO   → futuro
 *   - LUCRO_REAL        → futuro
 *   - OUTRO             → MEI configura manualmente
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmpresaService {

    private final EmpresaRepository empresaRepository;

    // Limites legais por regime (referência 2025/2026)
    private static final BigDecimal LIMITE_MEI                = new BigDecimal("81000.00");
    private static final BigDecimal LIMITE_SIMPLES_NACIONAL_ME  = new BigDecimal("360000.00");
    // EPP = 4.800.000 — não usado ainda

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

        // ── CNPJ (regra de imutabilidade — A1.3) ──────────────────────────────
        if (request.cnpj() != null) {
            String cnpjLimpo = CnpjValidator.apenasDigitos(request.cnpj());

            if (cnpjLimpo.isEmpty()) {
                if (empresa.getCnpj() != null) {
                    throw new IllegalArgumentException(
                            "CNPJ não pode ser removido. Para alterar, entre em contato com o suporte."
                    );
                }
            } else {
                String cnpjFormatado;
                try {
                    cnpjFormatado = CnpjValidator.normalizar(cnpjLimpo);
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("CNPJ inválido: " + e.getMessage());
                }

                if (empresa.getCnpj() != null && !empresa.getCnpj().equals(cnpjFormatado)) {
                    throw new IllegalArgumentException(
                            "CNPJ já cadastrado não pode ser alterado. " +
                                    "Para correção, entre em contato com o suporte."
                    );
                }

                if (empresa.getCnpj() == null) {
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

        // ── Regime tributário ─────────────────────────────────────────────────
        if (request.regimeTributario() != null) {
            RegimeTributario novoRegime = request.regimeTributario();
            RegimeTributario regimeAnterior = empresa.getRegimeTributario();

            empresa.setRegimeTributario(novoRegime);

            // Se mudou de MEI pra outro regime, limpa sub-campos MEI
            if (regimeAnterior == RegimeTributario.MEI && novoRegime != RegimeTributario.MEI) {
                empresa.setMeiCategoria(null);
                empresa.setMeiValorDasMensal(null);
                empresa.setDasAtivo(false);  // DAS atual é só MEI
                log.info("Empresa {} mudou de MEI pra {}: limpando sub-campos MEI",
                        empresa.getId(), novoRegime);
            }

            // Sugere limite default ao trocar pra regime conhecido
            if (empresa.getLimiteFaturamentoAnual() == null) {
                BigDecimal sugerido = limitePadraoRegime(novoRegime);
                if (sugerido != null) {
                    empresa.setLimiteFaturamentoAnual(sugerido);
                }
            }
        }

        // ── Limite faturamento anual ──────────────────────────────────────────
        if (request.limiteFaturamentoAnual() != null) {
            if (request.limiteFaturamentoAnual().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Limite anual deve ser maior que zero");
            }
            empresa.setLimiteFaturamentoAnual(request.limiteFaturamentoAnual());
        }

        // ── Sub-campos MEI ────────────────────────────────────────────────────
        if (empresa.getRegimeTributario() == RegimeTributario.MEI) {
            // Categoria MEI
            if (request.meiCategoria() != null) {
                empresa.setMeiCategoria(request.meiCategoria());
            }

            // Valor DAS manual (override)
            if (Boolean.TRUE.equals(request.meiValorDasMensalEditado())) {
                empresa.setMeiValorDasMensal(request.meiValorDasMensal());  // pode ser null
            }
        }

        // ── DAS toggle ────────────────────────────────────────────────────────
        if (request.dasAtivo() != null) {
            boolean novoDasAtivo = request.dasAtivo();

            if (novoDasAtivo) {
                // Hoje, só MEI tem DAS implementado
                if (empresa.getRegimeTributario() != RegimeTributario.MEI) {
                    throw new IllegalArgumentException(
                            "DAS automático disponível apenas para regime MEI nesta versão. " +
                                    "Suporte a Simples Nacional em breve."
                    );
                }
                if (empresa.getMeiCategoria() == null) {
                    throw new IllegalArgumentException(
                            "Selecione a categoria MEI antes de ativar o DAS"
                    );
                }
                empresa.setDasAtivo(true);
            } else {
                empresa.setDasAtivo(false);
            }
        }

        Empresa salva = empresaRepository.save(empresa);
        log.info("Empresa atualizada: {} (regime={}, dasAtivo={})",
                salva.getId(), salva.getRegimeTributario(), salva.getDasAtivo());

        return EmpresaResponse.from(salva, valorDasEfetivo(salva));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calcula valor efetivo do DAS:
     *   - DAS desativado: null
     *   - MEI com override manual: usa o override
     *   - MEI sem override: usa valor padrão da categoria
     *   - Outros regimes: null por enquanto (DAS percentual fica pra futuro)
     */
    public BigDecimal valorDasEfetivo(Empresa empresa) {
        if (!Boolean.TRUE.equals(empresa.getDasAtivo())) return null;
        if (empresa.getRegimeTributario() != RegimeTributario.MEI) return null;

        if (empresa.getMeiValorDasMensal() != null) {
            return empresa.getMeiValorDasMensal();
        }

        CategoriaMei cat = empresa.getMeiCategoria();
        return cat != null ? cat.getValorDasPadrao() : null;
    }

    /**
     * Limite anual padrão do regime (referência 2025/2026).
     */
    public BigDecimal limitePadraoRegime(RegimeTributario regime) {
        if (regime == null) return null;
        return switch (regime) {
            case MEI                -> LIMITE_MEI;
            case SIMPLES_NACIONAL   -> LIMITE_SIMPLES_NACIONAL_ME;  // ME default
            // Lucro Presumido/Real não tem limite legal universal — fica null
            // OUTRO/NENHUM também null
            default                 -> null;
        };
    }
}