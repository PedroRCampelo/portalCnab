package com.pedrocampelo.cnabportal.service;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {

    private final UsuarioRepository usuarioRepository;

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${stripe.price-id-pro}")
    private String priceIdPro;

    @Value("${app.url}")
    private String appUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    // Cria uma sessao de checkout do Stripe para o plano Pro
    // O usuario e identificado pelo metadata — o webhook usa isso para atualizar o plano
    public String criarCheckoutPro(Usuario usuario) throws StripeException {
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomerEmail(usuario.getEmail())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(priceIdPro)
                        .setQuantity(1L)
                        .build())
                .putMetadata("usuarioId", usuario.getId().toString())
                // Redireciona apos o pagamento
                .setSuccessUrl(appUrl + "/upgrade/sucesso?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(appUrl + "/upgrade/cancelado")
                .build();

        Session session = Session.create(params);
        log.info("Checkout criado para: {} — session: {}", usuario.getEmail(), session.getId());
        return session.getUrl();
    }

    // Processa eventos do webhook do Stripe
    // Chamado pelo StripeWebhookController ao receber POST /api/stripe/webhook
    public void processarWebhook(String payload, String sigHeader) throws SignatureVerificationException {
        Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

        switch (event.getType()) {
            case "checkout.session.completed" -> {
                // Usa o ID do evento para buscar a sessao diretamente — mais seguro e compativel
                try {
                    String sessionId = event.getData().getObject().toJson()
                            .contains("\"id\"") ? extractId(event.getData().getObject().toJson()) : null;

                    if (sessionId != null) {
                        Session session = Session.retrieve(sessionId);
                        String usuarioId = session.getMetadata() != null
                                ? session.getMetadata().get("usuarioId") : null;
                        if (usuarioId != null) {
                            ativarPlanoPro(UUID.fromString(usuarioId), session.getSubscription());
                        } else {
                            log.warn("usuarioId nao encontrado nos metadados da sessao: {}", sessionId);
                        }
                    }
                } catch (StripeException e) {
                    log.error("Erro ao buscar sessao do Stripe: {}", e.getMessage());
                    throw new RuntimeException("Erro ao processar checkout", e);
                }
            }
            case "customer.subscription.deleted" -> {
                // Assinatura cancelada — rebaixa para gratuito
                try {
                    String subscriptionJson = event.getData().getObject().toJson();
                    // Busca o customer ID para encontrar o usuario
                    int cidx = subscriptionJson.indexOf("\"customer\":");
                    if (cidx >= 0) {
                        int cstart = subscriptionJson.indexOf("\"", cidx + 11) + 1;
                        int cend   = subscriptionJson.indexOf("\"", cstart);
                        String customerId = subscriptionJson.substring(cstart, cend);
                        rebaixarParaGratuito(customerId);
                    }
                } catch (Exception e) {
                    log.error("Erro ao processar cancelamento: {}", e.getMessage());
                }
            }
            default -> log.debug("Evento Stripe ignorado: {}", event.getType());
        }
    }

    // Extrai o campo "id" do JSON do evento
    private String extractId(String json) {
        try {
            int idx = json.indexOf("\"id\":");
            if (idx < 0) return null;
            int start = json.indexOf("\"", idx + 5) + 1;
            int end   = json.indexOf("\"", start);
            return json.substring(start, end);
        } catch (Exception e) {
            return null;
        }
    }

    private void ativarPlanoPro(UUID usuarioId, String subscriptionId) {
        usuarioRepository.findById(usuarioId).ifPresentOrElse(usuario -> {
            usuario.setPlanoId(UUID.fromString("10000000-0000-0000-0000-000000000002"));
            usuarioRepository.save(usuario);
            log.info("Plano Pro ativado para: {} — subscription: {}", usuario.getEmail(), subscriptionId);
        }, () -> log.error("Usuario nao encontrado ao ativar Pro: {}", usuarioId));
    }

    private void rebaixarParaGratuito(String customerId) {
        // Busca usuario pelo plano_id pro e rebaixa para gratuito
        usuarioRepository.findAll().stream()
                .filter(u -> UUID.fromString("10000000-0000-0000-0000-000000000002").equals(u.getPlanoId()))
                .findFirst()
                .ifPresent(usuario -> {
                    usuario.setPlanoId(UUID.fromString("10000000-0000-0000-0000-000000000001"));
                    usuarioRepository.save(usuario);
                    log.info("Plano rebaixado para gratuito: {}", usuario.getEmail());
                });
    }

    // Cancela a assinatura ativa do usuario no Stripe
    public void cancelarAssinatura(Usuario usuario) throws StripeException {
        // Lista assinaturas ativas pelo email do customer
        com.stripe.param.CustomerListParams customerParams =
                com.stripe.param.CustomerListParams.builder()
                        .setEmail(usuario.getEmail())
                        .setLimit(1L)
                        .build();

        com.stripe.model.CustomerCollection customers =
                com.stripe.model.Customer.list(customerParams);

        if (customers.getData().isEmpty()) {
            throw new IllegalStateException("Nenhuma assinatura ativa encontrada");
        }

        String customerId = customers.getData().get(0).getId();

        com.stripe.param.SubscriptionListParams subParams =
                com.stripe.param.SubscriptionListParams.builder()
                        .setCustomer(customerId)
                        .setStatus(com.stripe.param.SubscriptionListParams.Status.ACTIVE)
                        .setLimit(1L)
                        .build();

        com.stripe.model.SubscriptionCollection subscriptions =
                com.stripe.model.Subscription.list(subParams);

        if (subscriptions.getData().isEmpty()) {
            throw new IllegalStateException("Nenhuma assinatura ativa encontrada");
        }

        com.stripe.model.Subscription subscription = subscriptions.getData().get(0);

        // Cancela ao fim do periodo atual
        subscription.update(
                com.stripe.param.SubscriptionUpdateParams.builder()
                        .setCancelAtPeriodEnd(true)
                        .build()
        );

        log.info("Assinatura configurada para cancelar no fim do periodo — usuario: {}", usuario.getEmail());
    }
}