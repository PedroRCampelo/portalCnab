package com.pedrocampelo.cnabportal.config;

import com.pedrocampelo.cnabportal.auth.JwtAuthenticationFilter;
import com.pedrocampelo.cnabportal.auth.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuracao central do Spring Security.
 *
 * Decisoes de seguranca tomadas aqui:
 *
 * 1. STATELESS: nao usamos sessao HTTP — cada requisicao e autenticada
 *    pelo token JWT. Isso e essencial para APIs REST e permite escalar
 *    horizontalmente sem estado compartilhado entre instancias.
 *
 * 2. CSRF desabilitado: CSRF e necessario apenas para aplicacoes com
 *    cookies de sessao. Como usamos JWT no header Authorization,
 *    nao ha risco de CSRF.
 *
 * 3. BCrypt com strength 12: o padrao e 10. Strength 12 e mais lento
 *    para atacantes (cada tentativa de brute-force demora mais),
 *    mas ainda rapido o suficiente para login normal (~300ms).
 *
 * 4. @EnableMethodSecurity: habilita @PreAuthorize nos controllers,
 *    permitindo controle de acesso por perfil em cada endpoint.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    // URLs do frontend — lidas do .env para nao hardcodar
    @Value("${app.cors.allowed-origins:http://localhost:5173,https://whallet.com.br,https://www.whallet.com.br}")
    private List<String> allowedOrigins;

    // ── Filtro principal de seguranca ─────────────────────────────────────────

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CORS configurado no bean abaixo
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // CSRF desabilitado — usamos JWT, nao cookies de sessao
            .csrf(AbstractHttpConfigurer::disable)

            // Sem sessao HTTP — cada requisicao e independente
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Regras de autorizacao por rota
            .authorizeHttpRequests(auth -> auth
                // Rotas publicas — nao precisam de token
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register"
                ).permitAll()

                // Apenas ADMIN pode gerenciar usuarios
                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                // Todas as outras rotas exigem autenticacao
                .anyRequest().authenticated()
            )

            // Adiciona o filtro JWT antes do filtro de autenticacao padrao
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ── CORS ──────────────────────────────────────────────────────────────────

    /**
     * Configura CORS para aceitar requisicoes do frontend React.
     *
     * Por que expor Authorization nos exposed headers?
     *   Para que o frontend consiga ler o token da resposta se necessario.
     *
     * Por que nao usar "*" nas origens?
     *   Wildcard nao funciona com credenciais (cookies, Authorization header).
     *   Listamos explicitamente os dominios permitidos.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Cache do preflight OPTIONS por 1 hora

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ── Autenticacao ──────────────────────────────────────────────────────────

    /**
     * Provider de autenticacao: usa UserDetailsService + BCrypt.
     * O Spring usa este provider quando AuthenticationManager.authenticate() e chamado.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * AuthenticationManager e necessario no AuthController para
     * processar o login (validar email + senha).
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * BCrypt com strength 12.
     * Usado para:
     *   - Fazer hash da senha no cadastro
     *   - Comparar senha no login
     *
     * NUNCA use MD5, SHA-1 ou SHA-256 para senhas — sao algoritmos
     * de hash rapido, vulneraveis a ataques de forca bruta.
     * BCrypt e especificamente projetado para ser lento.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
