package com.pedrocampelo.cnabportal.config.gate;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.gestaosv.PlanoGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Aspect que intercepta métodos anotados com @RequireWhalletPlus.
 *
 * Se o usuário autenticado NÃO tem Whallet+, lança PlanoInsuficienteException
 * (que vira HTTP 402). Senão, deixa a chamada prosseguir normalmente.
 *
 * Funciona em:
 *   - Métodos individuais: @RequireWhalletPlus em @GetMapping/@PostMapping
 *   - Classes inteiras: @RequireWhalletPlus em @RestController
 *
 * IMPORTANTE: Spring AOP precisa estar habilitado no projeto.
 * Spring Boot tem AOP habilitado por padrão se houver `spring-boot-starter-aop`
 * no pom.xml. Esse já está incluso transitivamente em outras dependências.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class PlanoGuardAspect {

    private final PlanoGuard planoGuard;

    /**
     * Intercepta métodos anotados com @RequireWhalletPlus.
     */
    @Around("@annotation(com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlus) " +
            "|| @within(com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlus)")
    public Object verificarPlano(ProceedingJoinPoint joinPoint) throws Throwable {
        Usuario usuario = obterUsuarioLogado();

        if (usuario == null) {
            // Sem autenticação — deixa o Spring Security tratar
            return joinPoint.proceed();
        }

        if (!planoGuard.temWhalletPlus(usuario)) {
            String slug = planoGuard.slugDoUsuario(usuario);
            log.info("Acesso negado por plano insuficiente: usuario={}, plano_atual={}",
                    usuario.getEmail(), slug);
            throw new PlanoInsuficienteException(PlanoGuard.SLUG_WHALLET_PLUS, slug);
        }

        return joinPoint.proceed();
    }

    /**
     * Extrai usuário autenticado do SecurityContext.
     */
    private Usuario obterUsuarioLogado() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;

            Object principal = auth.getPrincipal();
            if (principal instanceof Usuario usuario) {
                return usuario;
            }
            return null;
        } catch (Exception e) {
            log.warn("Erro ao obter usuário do SecurityContext: {}", e.getMessage());
            return null;
        }
    }
}