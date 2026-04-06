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

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
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

    // UUIDs fixos dos planos
    private static final UUID PLANO_GRATUITO     = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID PLANO_PRO          = UUID.fromString("10000000-0000-0000-0000-000000000002");
    private static final UUID PLANO_WHALLET_PLUS = UUID.fromString("10000000-0000-0000-0000-000000000003");

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    // ── Checkout Pro ──────────────────────────────────────────────────────────
    public String criarCheckoutPro(Usuario usuario) throws StripeException {
        return criarCheckout(usuario, priceIdPro, "pro");
    }

    // ── Checkout Whallet+ — cancela Pro ativo antes de criar nova assinatura ──
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

    // ── Status da assinatura (lê do banco, não chama o Stripe) ───────────────
    public Map<String, Object> getStatusAssinatura(Usuario usuario) {
        String status    = usuario.getAssinaturaStatus() != null ? usuario.getAssinaturaStatus() : "SEM_ASSINATURA";
        LocalDate expira = usuario.getAssinaturaExpiraEm();

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("status",    status);
        result.put("expiresAt", expira != null ? expira.atStartOfDay(ZoneId.of("America/Sao_Paulo")).toEpochSecond() : null);
        return result;
    }

    // ── Cancelamento ao fim do período (opção do usuário) ────────────────────
    public Map<String, Object> cancelarAssinatura(Usuario usuario) throws StripeException {
        com.stripe.model.Subscription subscription = buscarAssinaturaAtiva(usuario);
        subscription.update(
                com.stripe.param.SubscriptionUpdateParams.builder()
                        .setCancelAtPeriodEnd(true)
                        .build()
        );

        long expiresAtUnix    = subscription.getCurrentPeriodEnd();
        LocalDate expiraEm    = Instant.ofEpochSecond(expiresAtUnix)
                .atZone(ZoneId.of("America/Sao_Paulo"))
                .toLocalDate();

        // Salva o status no banco imediatamente
        usuario.setAssinaturaStatus("CANCELANDO");
        usuario.setAssinaturaExpiraEm(expiraEm);
        usuarioRepository.save(usuario);

        log.info("Assinatura marcada como CANCELANDO para: {} — expira em: {}", usuario.getEmail(), expiraEm);

        return Map.of(
                "mensagem",  "Assinatura cancelada com sucesso.",
                "expiresAt", expiresAtUnix,
                "expiraEm",  expiraEm.toString()
        );
    }

    // ── Cancelamento imediato (usado em upgrades) ─────────────────────────────
    private void cancelarAssinaturaImediato(Usuario usuario) throws StripeException {
        com.stripe.model.Subscription subscription = buscarAssinaturaAtiva(usuario);
        subscription.cancel();
        // Não muda o plano_id aqui — o webhook checkout.session.completed vai atualizar
        log.info("Assinatura cancelada imediatamente para upgrade: {}", usuario.getEmail());
    }

    // ── Histórico de pagamentos ───────────────────────────────────────────────
    public List<Map<String, Object>> historicoPageamentos(Usuario usuario) throws StripeException {
        String customerId = usuario.getStripeCustomerId();

        // Se não tem o customerId salvo, busca pelo e-mail
        if (customerId == null || customerId.isBlank()) {
            com.stripe.param.CustomerListParams cp = com.stripe.param.CustomerListParams.builder()
                    .setEmail(usuario.getEmail()).setLimit(1L).build();
            com.stripe.model.CustomerCollection customers = com.stripe.model.Customer.list(cp);
            if (customers.getData().isEmpty()) return List.of();
            customerId = customers.getData().get(0).getId();
            // Salva para próxima vez
            usuario.setStripeCustomerId(customerId);
            usuarioRepository.save(usuario);
        }

        com.stripe.param.PaymentIntentListParams piParams =
                com.stripe.param.PaymentIntentListParams.builder()
                        .setCustomer(customerId).setLimit(20L).build();

        return com.stripe.model.PaymentIntent.list(piParams).getData().stream()
                .filter(pi -> "succeeded".equals(pi.getStatus()))
                .map(pi -> {
                    Map<String, Object> item = new java.util.LinkedHashMap<>();
                    item.put("id",        pi.getId());
                    item.put("valor",     pi.getAmount());
                    item.put("moeda",     pi.getCurrency());
                    item.put("status",    pi.getStatus());
                    item.put("descricao", pi.getDescription() != null ? pi.getDescription() : "Assinatura Whallet");
                    item.put("criadoEm",  pi.getCreated());
                    return item;
                })
                .toList();
    }

    // ── Busca assinatura ativa no Stripe ─────────────────────────────────────
    private com.stripe.model.Subscription buscarAssinaturaAtiva(Usuario usuario) throws StripeException {
        String customerId = usuario.getStripeCustomerId();

        if (customerId == null || customerId.isBlank()) {
            com.stripe.param.CustomerListParams cp = com.stripe.param.CustomerListParams.builder()
                    .setEmail(usuario.getEmail()).setLimit(1L).build();
            com.stripe.model.CustomerCollection customers = com.stripe.model.Customer.list(cp);
            if (customers.getData().isEmpty()) throw new IllegalStateException("Nenhuma assinatura ativa encontrada");
            customerId = customers.getData().get(0).getId();
            usuario.setStripeCustomerId(customerId);
            usuarioRepository.save(usuario);
        }

        com.stripe.param.SubscriptionListParams subParams =
                com.stripe.param.SubscriptionListParams.builder()
                        .setCustomer(customerId)
                        .setStatus(com.stripe.param.SubscriptionListParams.Status.ACTIVE)
                        .setLimit(1L)
                        .build();

        com.stripe.model.SubscriptionCollection subscriptions =
                com.stripe.model.Subscription.list(subParams);

        if (subscriptions.getData().isEmpty()) throw new IllegalStateException("Nenhuma assinatura ativa encontrada");
        return subscriptions.getData().get(0);
    }

    // ── Webhook ───────────────────────────────────────────────────────────────
    public void processarWebhook(String payload, String sigHeader) throws SignatureVerificationException {
        Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        log.info("Webhook Stripe recebido: {}", event.getType());

        switch (event.getType()) {

            case "checkout.session.completed" -> {
                try {
                    String sessionId = extractId(event.getData().getObject().toJson());
                    if (sessionId == null) { log.warn("session_id nulo no evento"); break; }

                    Session session   = Session.retrieve(sessionId);
                    String usuarioId  = session.getMetadata() != null ? session.getMetadata().get("usuarioId") : null;
                    String plano      = session.getMetadata() != null ? session.getMetadata().getOrDefault("plano", "pro") : "pro";
                    String subId      = session.getSubscription();
                    String customerId = session.getCustomer();

                    if (usuarioId == null) { log.warn("usuarioId ausente nos metadados: {}", sessionId); break; }

                    UUID planoId = "whallet-plus".equals(plano) ? PLANO_WHALLET_PLUS : PLANO_PRO;
                    ativarPlano(UUID.fromString(usuarioId), planoId, subId, customerId, plano);

                } catch (StripeException e) {
                    log.error("Erro ao processar checkout.session.completed: {}", e.getMessage());
                    throw new RuntimeException("Erro ao processar checkout", e);
                }
            }

            case "customer.subscription.deleted" -> {
                try {
                    String subscriptionJson = event.getData().getObject().toJson();
                    String subscriptionId   = extractId(subscriptionJson);
                    String customerId       = extrairCampo(subscriptionJson, "customer");

                    if (customerId == null) { log.warn("customerId ausente no evento subscription.deleted"); break; }

                    // Busca por subscriptionId primeiro (mais preciso), depois por customerId
                    Usuario usuario = null;
                    if (subscriptionId != null) {
                        usuario = usuarioRepository.findByStripeSubscriptionId(subscriptionId).orElse(null);
                    }
                    if (usuario == null) {
                        com.stripe.model.Customer customer = com.stripe.model.Customer.retrieve(customerId);
                        if (customer.getEmail() != null) {
                            usuario = usuarioRepository.findByEmail(customer.getEmail()).orElse(null);
                        }
                    }

                    if (usuario == null) { log.warn("Usuário não encontrado para subscription.deleted: {}", subscriptionId); break; }

                    // Só rebaixa se ainda estava no plano pago (não foi upgrade)
                    if (PLANO_PRO.equals(usuario.getPlanoId()) || PLANO_WHALLET_PLUS.equals(usuario.getPlanoId())) {
                        usuario.setPlanoId(PLANO_GRATUITO);
                        usuario.setAssinaturaStatus("EXPIRADA");
                        usuario.setStripeSubscriptionId(null);
                        usuarioRepository.save(usuario);
                        log.info("Plano expirado — rebaixado para gratuito: {}", usuario.getEmail());
                    } else {
                        log.info("subscription.deleted ignorado — usuário já em outro plano: {}", usuario.getEmail());
                    }
                } catch (Exception e) {
                    log.error("Erro ao processar subscription.deleted: {}", e.getMessage());
                }
            }

            case "invoice.payment_failed" -> {
                // Pagamento falhou — marca para investigação mas não rebaixa imediatamente
                try {
                    String invoiceJson = event.getData().getObject().toJson();
                    String customerId  = extrairCampo(invoiceJson, "customer");
                    if (customerId != null) {
                        com.stripe.model.Customer customer = com.stripe.model.Customer.retrieve(customerId);
                        if (customer.getEmail() != null) {
                            log.warn("Pagamento falhou para: {} — verificar no painel Stripe", customer.getEmail());
                        }
                    }
                } catch (Exception e) {
                    log.error("Erro ao processar invoice.payment_failed: {}", e.getMessage());
                }
            }

            case "customer.subscription.updated" -> {
                // Atualiza status se a assinatura foi reativada (cancelamento revertido)
                try {
                    String subscriptionJson = event.getData().getObject().toJson();
                    String subscriptionId   = extractId(subscriptionJson);
                    boolean cancelAtEnd     = subscriptionJson.contains("\"cancel_at_period_end\":true");

                    if (subscriptionId != null && !cancelAtEnd) {
                        usuarioRepository.findByStripeSubscriptionId(subscriptionId).ifPresent(usuario -> {
                            if ("CANCELANDO".equals(usuario.getAssinaturaStatus())) {
                                usuario.setAssinaturaStatus("ATIVA");
                                usuario.setAssinaturaExpiraEm(null);
                                usuarioRepository.save(usuario);
                                log.info("Cancelamento revertido — assinatura ATIVA novamente: {}", usuario.getEmail());
                            }
                        });
                    }
                } catch (Exception e) {
                    log.error("Erro ao processar subscription.updated: {}", e.getMessage());
                }
            }

            default -> log.debug("Evento Stripe não tratado: {}", event.getType());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void ativarPlano(UUID usuarioId, UUID planoId, String subscriptionId, String customerId, String nomePlano) {
        usuarioRepository.findById(usuarioId).ifPresentOrElse(usuario -> {
            usuario.setPlanoId(planoId);
            usuario.setAssinaturaStatus("ATIVA");
            usuario.setAssinaturaExpiraEm(null);
            if (subscriptionId != null) usuario.setStripeSubscriptionId(subscriptionId);
            if (customerId     != null) usuario.setStripeCustomerId(customerId);
            usuarioRepository.save(usuario);
            log.info("Plano {} ativado para: {} — sub: {}", nomePlano, usuario.getEmail(), subscriptionId);
        }, () -> log.error("Usuário não encontrado ao ativar plano {}: {}", nomePlano, usuarioId));
    }

    private String extractId(String json) {
        try {
            int idx = json.indexOf("\"id\":");
            if (idx < 0) return null;
            int start = json.indexOf("\"", idx + 5) + 1;
            int end   = json.indexOf("\"", start);
            return json.substring(start, end);
        } catch (Exception e) { return null; }
    }

    private String extrairCampo(String json, String campo) {
        try {
            String search = "\"" + campo + "\":\"";
            int idx = json.indexOf(search);
            if (idx < 0) return null;
            int start = idx + search.length();
            int end   = json.indexOf("\"", start);
            return json.substring(start, end);
        } catch (Exception e) { return null; }
    }
}