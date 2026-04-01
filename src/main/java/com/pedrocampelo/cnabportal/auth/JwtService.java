package com.pedrocampelo.cnabportal.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Servico responsavel por gerar e validar tokens JWT.
 *
 * Estrutura do token JWT:
 *   Header:  algoritmo de assinatura (HS256)
 *   Payload: claims (sub=email, perfil, empresa, iat, exp)
 *   Signature: HMAC-SHA256 com a chave secreta do .env
 *
 * Por que incluir perfil e empresaId no token?
 *   Para evitar uma consulta ao banco em cada requisicao.
 *   O filtro JWT pode extrair essas informacoes direto do token.
 *
 * SEGURANCA: a chave JWT_SECRET do .env deve ter no minimo 64 bytes.
 * Chaves fracas permitem ataques de forca bruta na assinatura do token.
 */
@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms:28800000}")
    private long expirationMs;

    // ── Geracao do token ──────────────────────────────────────────────────────

    /**
     * Gera token JWT para o usuario autenticado.
     * Inclui email (sub), perfil e empresaId como claims extras.
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> extraClaims = new HashMap<>();

        // Adiciona perfil e empresaId se for uma instancia de Usuario
        if (userDetails instanceof com.pedrocampelo.cnabportal.model.Usuario usuario) {
            extraClaims.put("perfil", usuario.getPerfil().name());
            if (usuario.getEmpresa() != null) {
                extraClaims.put("empresaId", usuario.getEmpresa().getId().toString());
            }
        }

        return buildToken(extraClaims, userDetails);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())   // email do usuario
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    // ── Validacao do token ────────────────────────────────────────────────────

    /**
     * Valida o token: verifica assinatura, expiracao e se pertence ao usuario.
     *
     * Retorna false (sem lancar excecao) para nao vazar informacao sobre
     * o motivo da rejeicao para o cliente.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String email = extractUsername(token);
            return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Token JWT invalido: {}", e.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ── Extracao de claims ────────────────────────────────────────────────────

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ── Chave de assinatura ───────────────────────────────────────────────────

    /**
     * Deriva a chave HMAC-SHA256 a partir do secret configurado no .env.
     * Keys.hmacShaKeyFor exige no minimo 256 bits (32 bytes).
     * Nosso secret de 64 bytes esta bem acima do minimo.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
