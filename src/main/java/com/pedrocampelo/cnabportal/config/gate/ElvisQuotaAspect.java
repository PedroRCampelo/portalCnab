package com.pedrocampelo.cnabportal.config.gate;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.gestaosv.ElvisQuotaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Aspect que aplica gate de quota do Elvis em métodos anotados.
 *
 * Fluxo:
 *   1. Obtém usuário logado do SecurityContext
 *   2. Verifica se pode fazer mais 1 pergunta (lança exception se não)
 *   3. Executa o método (joinPoint.proceed())
 *   4. Se método executou COM SUCESSO → incrementa contador
 *   5. Se método lançou exception → NÃO incrementa (perda do user)
 *
 * Decisão importante:
 *   Anônimos (sem auth) PASSAM SEM CONSUMIR QUOTA.
 *   Isso é intencional: o gate é por usuário; quem chama anônimo deve ter
 *   outro gate (ex: BannerAnonimo no frontend, IP-based, etc).
 *   Se você quiser bloquear anônimos do Elvis, adicione @PreAuthorize antes.
 *
 * Sprint A3.9.2
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ElvisQuotaAspect {

    private final ElvisQuotaService elvisQuotaService;

    @Around("@annotation(com.pedrocampelo.cnabportal.config.gate.RequireElvisQuota) " +
            "|| @within(com.pedrocampelo.cnabportal.config.gate.RequireElvisQuota)")
    public Object verificarQuota(ProceedingJoinPoint joinPoint) throws Throwable {
        Usuario usuario = obterUsuarioLogado();

        // Anônimo: passa direto (gate é por usuário)
        if (usuario == null) {
            return joinPoint.proceed();
        }

        // 1. Verifica ANTES — pode lançar ElvisQuotaExcedidaException
        elvisQuotaService.verificarLimite(usuario);

        // 2. Executa o método
        Object resultado = joinPoint.proceed();

        // 3. Se chegou aqui, executou com sucesso → incrementa
        try {
            elvisQuotaService.registrarPergunta(usuario);
        } catch (Exception e) {
            // Não falha a request por causa do incremento — só loga
            // (pior dos mundos: user perderia a resposta por causa de count)
            log.error("Falha ao registrar pergunta Elvis pra {}: {}",
                    usuario.getEmail(), e.getMessage(), e);
        }

        return resultado;
    }

    /* ─── Helper ─────────────────────────────────────────────────────────── */

    private Usuario obterUsuarioLogado() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            Object principal = auth.getPrincipal();
            return principal instanceof Usuario u ? u : null;
        } catch (Exception e) {
            log.warn("Erro ao obter usuário do SecurityContext: {}", e.getMessage());
            return null;
        }
    }
}