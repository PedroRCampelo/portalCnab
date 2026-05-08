package com.pedrocampelo.cnabportal.config.gate;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.gestaosv.PlanoGuard;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Set;

/**
 * Aspect que aplica gate de plano em controllers anotados.
 *
 * Suporta 2 modos:
 *   - @RequireWhalletPlus      → bloqueia TUDO (leitura + escrita)
 *   - @RequireWhalletPlusWrite → bloqueia só escrita (POST/PUT/PATCH/DELETE)
 *                                GET passa livre pra Free (read-only)
 *
 * Decisão: detectamos escrita pelo VERBO HTTP, não pelo nome do método.
 * Funciona pra 99% dos casos REST. Se algum POST for "consulta" (caso raro),
 * basta usar @RequireWhalletPlus em vez de @RequireWhalletPlusWrite naquele
 * controller.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class PlanoGuardAspect {

    private final PlanoGuard planoGuard;

    /** Verbos HTTP considerados ESCRITA. */
    private static final Set<String> METODOS_ESCRITA = Set.of("POST", "PUT", "PATCH", "DELETE");

    // ─────────────────────────────────────────────────────────────────────────
    // Modo: @RequireWhalletPlus → bloqueia TUDO
    // ─────────────────────────────────────────────────────────────────────────

    @Around("@annotation(com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlus) " +
            "|| @within(com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlus)")
    public Object verificarPlanoTotal(ProceedingJoinPoint joinPoint) throws Throwable {
        Usuario usuario = obterUsuarioLogado();
        if (usuario == null) return joinPoint.proceed();

        if (!planoGuard.temWhalletPlus(usuario)) {
            String slug = planoGuard.slugDoUsuario(usuario);
            log.info("Acesso negado (gate total): usuario={}, plano={}",
                    usuario.getEmail(), slug);
            throw new PlanoInsuficienteException(PlanoGuard.SLUG_WHALLET_PLUS, slug);
        }
        return joinPoint.proceed();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Modo: @RequireWhalletPlusWrite → bloqueia só ESCRITA
    // ─────────────────────────────────────────────────────────────────────────

    @Around("@annotation(com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite) " +
            "|| @within(com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite)")
    public Object verificarPlanoEscrita(ProceedingJoinPoint joinPoint) throws Throwable {
        Usuario usuario = obterUsuarioLogado();
        if (usuario == null) return joinPoint.proceed();

        // Se é GET (leitura), libera sempre
        String metodoHttp = obterMetodoHttp();
        if (metodoHttp == null || !METODOS_ESCRITA.contains(metodoHttp)) {
            return joinPoint.proceed();
        }

        // É escrita → exige Whallet+
        if (!planoGuard.temWhalletPlus(usuario)) {
            String slug = planoGuard.slugDoUsuario(usuario);
            log.info("Acesso negado (gate escrita): usuario={}, plano={}, metodo={}",
                    usuario.getEmail(), slug, metodoHttp);
            throw new PlanoInsuficienteException(PlanoGuard.SLUG_WHALLET_PLUS, slug);
        }
        return joinPoint.proceed();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

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

    /**
     * Extrai o verbo HTTP da requisição corrente.
     * Funciona porque Spring MVC mantém o request no thread local.
     */
    private String obterMetodoHttp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes)
                    RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest request = attrs.getRequest();
            return request.getMethod() != null ? request.getMethod().toUpperCase() : null;
        } catch (Exception e) {
            log.warn("Erro ao obter método HTTP: {}", e.getMessage());
            return null;
        }
    }
}