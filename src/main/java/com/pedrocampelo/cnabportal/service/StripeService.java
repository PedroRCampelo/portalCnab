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

    @Value("${stripe.price-id-whallet-plus:}")
    private String priceIdWhalletPlus;

    @Value("${app.url}")
    private String appUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    // ── Checkout Pro ──────────────────────────────────────────────────────────
    public String criarCheckoutPro(Usuario usuario) throws StripeException {
        return criarCheckout(usuario, priceIdPro, "pro");
    }

    // ── Checkout Whallet+ ─────────────────────────────────────────────────────
    // Se o usuário tem Pro ativo, cancela antes para evitar cobrança dupla
    public String criarCheckoutWhalletPlus(Usuario usuario) throws StripeException {
        if (priceIdWhalletPlus == null || priceIdWhalletPlus.isBlank()) {
            throw new IllegalStateException("Plano Whallet+ ainda não configurado. Entre em contato.");
        }
        try {
            cancelarAssinaturaImediato(usuario);
            log.info("Assinatura Pro cancelada para upgrade Whallet+: {}", usuario.getEmail());
        } catch (IllegalStateException e) {
            log.debug("Nenhuma assinatura ativa ao criar checkout Whallet+: {}", e.getMessage());
        }
        return criarCheckout(usuario, priceIdWhalletPlus, "whallet-plus");
    }

    // ── Checkout interno ──────────────────────────────────────────────────────
    private String criarCheckout(Usuario usuario, String priceId, String plano) throws StripeException {
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomerEmail(usuario.getEmail())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(priceId)
                        .setQuantity(1L)
                        .build())
                .putMetadata("usuarioId", usuario.getId().toString())
                .putMetadata("plano", plano)
                .setSuccessUrl(appUrl + "/upgrade/sucesso?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(appUrl + "/planos")
                .build();

        Session session = Session.create(params);
        log.info("Checkout {} criado para: {} — session: {}", plano, usuario.getEmail(), session.getId());
        return session.getUrl();
    }

    // ── Cancelamento ao fim do período (opção do usuário) ────────────────────
    public void cancelarAssinatura(Usuario usuario) throws StripeException {
        com.stripe.model.Subscription subscription = buscarAssinaturaAtiva(usuario);
        subscription.update(
                com.stripe.param.SubscriptionUpdateParams.builder()
                        .setCancelAtPeriodEnd(true)
                        .build()
        );
        log.info("Assinatura configurada para cancelar no fim do período: {}", usuario.getEmail());
    }

    // ── Cancelamento imediato (usado em upgrades) ─────────────────────────────
    private void cancelarAssinaturaImediato(Usuario usuario) throws StripeException {
        com.stripe.model.Subscription subscription = buscarAssinaturaAtiva(usuario);
        subscription.cancel();
        log.info("Assinatura cancelada imediatamente para upgrade: {}", usuario.getEmail());
    }

    // ── Busca assinatura ativa no Stripe ─────────────────────────────────────
    private com.stripe.model.Subscription buscarAssinaturaAtiva(Usuario usuario) throws StripeException {
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

        return subscriptions.getData().get(0);
    }

    // ── Webhook ───────────────────────────────────────────────────────────────
    public void processarWebhook(String payload, String sigHeader) throws SignatureVerificationException {
        Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

        switch (event.getType()) {
            case "checkout.session.completed" -> {
                try {
                    String sessionId = extractId(event.getData().getObject().toJson());
                    if (sessionId != null) {
                        Session session = Session.retrieve(sessionId);
                        String usuarioId = session.getMetadata() != null
                                ? session.getMetadata().get("usuarioId") : null;
                        String plano = session.getMetadata() != null
                                ? session.getMetadata().getOrDefault("plano", "pro") : "pro";
                        if (usuarioId != null) {
                            if ("whallet-plus".equals(plano)) {
                                ativarPlanoPorId(UUID.fromString(usuarioId),
                                        UUID.fromString("10000000-0000-0000-0000-000000000003"),
                                        session.getSubscription(), "Whallet+");
                            } else {
                                ativarPlanoPorId(UUID.fromString(usuarioId),
                                        UUID.fromString("10000000-0000-0000-0000-000000000002"),
                                        session.getSubscription(), "Pro");
                            }
                        } else {
                            log.warn("usuarioId não encontrado nos metadados: {}", sessionId);
                        }
                    }
                } catch (StripeException e) {
                    log.error("Erro ao buscar sessão do Stripe: {}", e.getMessage());
                    throw new RuntimeException("Erro ao processar checkout", e);
                }
            }
            case "customer.subscription.deleted" -> {
                try {
                    String subscriptionJson = event.getData().getObject().toJson();

                    // Extrai customerId
                    int cidx = subscriptionJson.indexOf("\"customer\":");
                    if (cidx < 0) break;
                    int cstart = subscriptionJson.indexOf("\"", cidx + 11) + 1;
                    int cend   = subscriptionJson.indexOf("\"", cstart);
                    String customerId = subscriptionJson.substring(cstart, cend);

                    // Busca o usuário pelo e-mail do customer no Stripe
                    com.stripe.model.Customer customer = com.stripe.model.Customer.retrieve(customerId);
                    String email = customer.getEmail();
                    if (email == null) {
                        log.warn("Customer sem e-mail ao processar cancelamento: {}", customerId);
                        break;
                    }

                    usuarioRepository.findByEmail(email).ifPresent(usuario -> {
                        // Só rebaixa se o usuário ainda estiver no plano que foi cancelado.
                        // Se já está no Whallet+ (upgrade em andamento), NÃO rebaixa.
                        UUID planoAtual = usuario.getPlanoId();
                        UUID gratuito   = UUID.fromString("10000000-0000-0000-0000-000000000001");
                        UUID pro        = UUID.fromString("10000000-0000-0000-0000-000000000002");

                        if (pro.equals(planoAtual)) {
                            // Cancelou o Pro sem upgrade — rebaixa para gratuito
                            usuario.setPlanoId(gratuito);
                            usuarioRepository.save(usuario);
                            log.info("Plano Pro cancelado — rebaixado para gratuito: {}", email);
                        } else {
                            // Whallet+ ou gratuito — evento de cancelamento do Pro durante upgrade, ignora
                            log.info("subscription.deleted ignorado para {} — plano atual: {}", email, planoAtual);
                        }
                    });
                } catch (Exception e) {
                    log.error("Erro ao processar cancelamento de assinatura: {}", e.getMessage());
                }
            }
            default -> log.debug("Evento Stripe ignorado: {}", event.getType());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void ativarPlanoPorId(UUID usuarioId, UUID planoId, String subscriptionId, String nomePlano) {
        usuarioRepository.findById(usuarioId).ifPresentOrElse(usuario -> {
            usuario.setPlanoId(planoId);
            usuarioRepository.save(usuario);
            log.info("Plano {} ativado para: {} — subscription: {}", nomePlano, usuario.getEmail(), subscriptionId);
        }, () -> log.error("Usuário não encontrado ao ativar plano {}: {}", nomePlano, usuarioId));
    }

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
}