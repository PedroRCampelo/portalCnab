package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.model.Plano;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.PlanoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service utilitário pra verificar plano do usuário.
 *
 * Slugs estáveis (definidos na migration V25):
 *   - "gratuito"
 *   - "pro"
 *   - "whallet-plus"
 *
 * Uso típico:
 *   if (!planoGuard.temWhalletPlus(usuario)) {
 *       throw new PlanoInsuficienteException("whallet-plus");
 *   }
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlanoGuard {

    public static final String SLUG_GRATUITO     = "gratuito";
    public static final String SLUG_PRO          = "pro";
    public static final String SLUG_WHALLET_PLUS = "whallet-plus";

    private final PlanoRepository planoRepository;
    private final TrialService trialService;

    /**
     * Retorna o slug do plano do usuário, ou "gratuito" se não tem.
     */
    @Transactional(readOnly = true)
    public String slugDoUsuario(Usuario usuario) {
        if (usuario == null || usuario.getPlanoId() == null) {
            return SLUG_GRATUITO;
        }
        return planoRepository.findById(usuario.getPlanoId())
                .map(Plano::getSlug)
                .orElse(SLUG_GRATUITO);
    }

    /**
     * Verifica se usuário tem plano Whallet+ ativo.
     *
     * IMPORTANTE: também valida assinatura ativa.
     * Mesmo que MEI tenha planoId Whallet+, se a assinatura está EXPIRADA
     * ou CANCELADA, considera que NÃO tem o plano.
     */
    @Transactional(readOnly = true)
    public boolean temWhalletPlus(Usuario usuario) {
        if (usuario == null) return false;
        if (!SLUG_WHALLET_PLUS.equals(slugDoUsuario(usuario))) return false;

        // Verifica se a assinatura está ativa
        return assinaturaAtiva(usuario);
    }

    /**
     * Verifica se usuário tem qualquer plano pago (Pro ou Whallet+).
     * Útil pra features compartilhadas entre planos pagos no futuro.
     */
    @Transactional(readOnly = true)
    public boolean temPlanoPago(Usuario usuario) {
        if (usuario == null) return false;
        String slug = slugDoUsuario(usuario);
        if (SLUG_GRATUITO.equals(slug)) return false;
        return assinaturaAtiva(usuario);
    }

    /**
     * Verifica se a assinatura do usuário está ativa.
     * Status válidos: "ATIVA" ou "CANCELANDO" (paga mas vai cancelar no fim do ciclo).
     *
     * Sprint A3.9: visibilidade alterada de private → public
     * pra ser usado pelo ElvisQuotaService.
     */
    public boolean assinaturaAtiva(Usuario usuario) {
        String status = usuario.getAssinaturaStatus();
        if (status == null || "SEM_ASSINATURA".equals(status)) return false;
        if ("EXPIRADA".equals(status)) return false;

        // Trial: verifica se ainda está dentro do prazo
        if ("TRIAL".equals(status)) {
            // Se expirou, TrialService reverte pra Free e retorna false
            if (trialService.verificarEExpirarSeNecessario(usuario)) {
                return false;  // trial acabou de expirar
            }
            return true;  // trial ainda ativo
        }

        // ATIVA ou CANCELANDO: ainda paga, libera
        return true;
    }
}