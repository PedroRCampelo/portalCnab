package com.pedrocampelo.cnabportal.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.GeneralSecurityException;
import java.io.IOException;
import java.util.Collections;

/**
 * Valida ID Tokens emitidos pelo Google Identity Services.
 *
 * Por que validar no backend mesmo o token vindo do nosso próprio frontend?
 *   1. Frontend pode ser comprometido / interceptado
 *   2. Token poderia ser de outro client_id (ataque de "audience confusion")
 *   3. Token poderia estar expirado
 *
 * A biblioteca oficial do Google faz tudo isso automaticamente:
 *   - Baixa e cacheia chaves públicas (JWKS) do Google
 *   - Valida assinatura RSA
 *   - Valida iss (https://accounts.google.com)
 *   - Valida aud (deve bater com GOOGLE_CLIENT_ID)
 *   - Valida exp (não expirado)
 */
@Service
@Slf4j
public class GoogleTokenVerifier {

    @Value("${app.google.client-id}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    void init() {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                // Aceita apenas tokens emitidos para nosso client_id
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        log.info("GoogleTokenVerifier inicializado para client_id={}",
                mascararClientId(googleClientId));
    }

    /**
     * Valida o ID Token e retorna o payload (claims) se válido.
     *
     * @return Payload com email, name, sub, picture, etc.
     * @throws InvalidGoogleTokenException se token for inválido, expirado, ou
     *                                     do client_id errado
     */
    public Payload verificar(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                throw new InvalidGoogleTokenException(
                        "Token inválido: assinatura, audience ou expiração rejeitadas"
                );
            }

            Payload payload = idToken.getPayload();

            // Camada extra: exigir email verificado.
            // Se um atacante conseguisse criar conta Google com email arbitrário
            // sem verificar, poderia tomar conta de usuários existentes do Whallet
            // que tivessem o mesmo email.
            Boolean emailVerificado = payload.getEmailVerified();
            if (!Boolean.TRUE.equals(emailVerificado)) {
                throw new InvalidGoogleTokenException(
                        "Email não verificado pelo Google"
                );
            }

            return payload;

        } catch (GeneralSecurityException | IOException e) {
            log.error("Erro técnico ao validar token Google", e);
            throw new InvalidGoogleTokenException("Falha ao validar token", e);
        }
    }

    private String mascararClientId(String clientId) {
        if (clientId == null || clientId.length() < 12) return "***";
        return clientId.substring(0, 8) + "..." + clientId.substring(clientId.length() - 4);
    }

    /**
     * Exceção específica — capturada no AuthController para retornar 401.
     */
    public static class InvalidGoogleTokenException extends RuntimeException {
        public InvalidGoogleTokenException(String message) {
            super(message);
        }
        public InvalidGoogleTokenException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}