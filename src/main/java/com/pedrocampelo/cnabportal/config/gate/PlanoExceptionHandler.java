package com.pedrocampelo.cnabportal.config.gate;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Converte PlanoInsuficienteException em HTTP 402 Payment Required.
 *
 * 402 é o status HTTP literalmente projetado pra esse caso (RFC 9110):
 *   "The 402 (Payment Required) status code is reserved for future use."
 *
 * Bem suportado por SaaS modernos (Stripe, GitHub, Slack usam 402 pra
 * sinalizar que a feature exige assinatura).
 *
 * Frontend detecta o 402 via interceptor axios e mostra paywall.
 */
@RestControllerAdvice
public class PlanoExceptionHandler {

    @ExceptionHandler(PlanoInsuficienteException.class)
    public ResponseEntity<Map<String, String>> handlePlanoInsuficiente(PlanoInsuficienteException e) {
        return ResponseEntity
                .status(HttpStatus.PAYMENT_REQUIRED)  // 402
                .body(Map.of(
                        "codigo",       "PLANO_INSUFICIENTE",
                        "mensagem",     e.getMessage(),
                        "planoExigido", e.getPlanoExigido(),
                        "planoAtual",   e.getPlanoAtual()
                ));
    }
}