package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.StripeService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeController {

    private final StripeService stripeService;

    // Cria sessao de checkout e retorna a URL do Stripe
    // Frontend redireciona o usuario para essa URL
    @PostMapping("/checkout/pro")
    public ResponseEntity<?> checkoutPro(@AuthenticationPrincipal Usuario usuario) {
        try {
            String url = stripeService.criarCheckoutPro(usuario);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (StripeException e) {
            log.error("Erro ao criar checkout Stripe: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro ao iniciar pagamento. Tente novamente."));
        }
    }

    // Webhook — recebe eventos do Stripe
    // Deve ser publico (sem autenticacao) — a validacao e feita pela assinatura do webhook
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            stripeService.processarWebhook(payload, sigHeader);
            return ResponseEntity.ok().build();
        } catch (SignatureVerificationException e) {
            // Assinatura invalida — pode ser tentativa de fraude
            log.warn("Webhook com assinatura invalida recebido");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Erro ao processar webhook Stripe: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}