package com.pedrocampelo.cnabportal.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro JWT que intercepta TODAS as requisicoes HTTP.
 *
 * Fluxo de cada requisicao:
 *   1. Le o header Authorization: Bearer <token>
 *   2. Se nao tiver token, passa adiante (Spring Security decide se a rota e publica)
 *   3. Extrai o email do token
 *   4. Busca o usuario no banco
 *   5. Valida o token (assinatura + expiracao + email)
 *   6. Se valido, registra o usuario no SecurityContext
 *   7. Passa para o proximo filtro / controller
 *
 * Por que OncePerRequestFilter?
 *   Garante que o filtro roda exatamente uma vez por requisicao,
 *   mesmo em casos de forward/dispatch internos do Servlet.
 *
 * SEGURANCA:
 *   - Nunca logamos o token completo — apenas o email extraido
 *   - Erros de token sao silenciosos para o cliente (apenas 401)
 *   - O SecurityContext e limpo automaticamente apos a requisicao
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService            jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest  request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain         filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Se nao tem header Authorization ou nao comeca com "Bearer ", passa adiante
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extrai o token removendo o prefixo "Bearer "
        final String token = authHeader.substring(7);
        String email = null;

        try {
            email = jwtService.extractUsername(token);
        } catch (Exception e) {
            // Token malformado ou com assinatura invalida
            // Nao logamos o token — apenas o motivo
            log.warn("Falha ao extrair email do token JWT: {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        // Se extraiu o email e o usuario ainda nao esta autenticado nesta requisicao
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            if (jwtService.isTokenValid(token, userDetails)) {
                // Cria o objeto de autenticacao com as roles do usuario
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,  // credentials nulas apos autenticacao
                                userDetails.getAuthorities()
                        );

                // Adiciona detalhes da requisicao (IP, session id) para auditoria futura
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Registra o usuario como autenticado no contexto desta requisicao
                SecurityContextHolder.getContext().setAuthentication(authToken);

                log.debug("Usuario autenticado via JWT: {}", email);
            } else {
                log.warn("Token JWT invalido para o usuario: {}", email);
            }
        }

        filterChain.doFilter(request, response);
    }
}
