package com.pedrocampelo.cnabportal.service.stripesv;

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

    private static final UUID PLANO_GRATUITO     = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID PLANO_PRO          = UUID.fromString("10000000-0000-0000-0000-000000000002");
    private static final UUID PLANO_WHALLET_PLUS = UUID.fromString("10000000-0000-0000-0000-000000000003");

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
        log.info("Stripe inicializado — pro: {} | whallet+: {}", priceIdPro,
                priceIdWhalletPlus.isBlank() ? "NÃO CONFIGURADO" : "ok");
    }

    // ── Checkout Pro ──────────────────────────────────────────────────────────
    public String criarCheckoutPro(Usuario usuario) throws StripeException {
        return criarCheckout(usuario, priceIdPro, "pro");
    }

    // ── Upgrade para Whallet+ ─────────────────────────────────────────────────
    // Se o usuário já tem Pro ativo: usa Subscription Update com proration
    //   → Stripe credita os dias não usados do Pro e cobra só a diferença
    //   → Sem segundo checkout, sem dupla cobrança
    // Se não tem assinatura ativa: checkout normal
    public String criarCheckoutWhalletPlus(Usuario usuario) throws StripeException {
        if (priceIdWhalletPlus == null || priceIdWhalletPlus.isBlank()) {
            throw new IllegalStateException("Plano Whallet+ ainda não configurado. Entre em contato.");
        }

        try {
            com.stripe.model.Subscription sub = buscarAssinaturaAtiva(usuario);
            com.stripe.model.SubscriptionItem item = sub.getItems().getData().get(0);

            // Atualiza o preço da assinatura existente com proration
            sub.update(
                    com.stripe.param.SubscriptionUpdateParams.builder()
                            .addItem(com.stripe.param.SubscriptionUpdateParams.Item.builder()
                                    .setId(item.getId())
                                    .setPrice(priceIdWhalletPlus)
                                    .build())
                            .setProrationBehavior(
                                    com.stripe.param.SubscriptionUpdateParams.ProrationBehavior.CREATE_PRORATIONS)
                            .putMetadata("usuarioId", usuario.getId().toString())
                            .putMetadata("plano", "whallet-plus")
                            .build()
            );

            // Ativa imediatamente no banco — não precisa de webhook
            ativarPlano(usuario.getId(), PLANO_WHALLET_PLUS,
                    sub.getId(), usuario.getStripeCustomerId(), "whallet-plus");

            log.info("Upgrade Pro→Whallet+ com proration: {}", usuario.getEmail());

            // Redireciona direto para sucesso (sem nova sessão de checkout)
            return appUrl + "/upgrade/sucesso";

        } catch (IllegalStateException e) {
            // Sem assinatura ativa — fluxo normal de checkout
            log.debug("Sem assinatura ativa, criando checkout Whallet+: {}", usuario.getEmail());
        }

        return criarCheckout(usuario, priceIdWhalletPlus, "whallet-plus");
    }

    // ── Checkout interno — usa customerId quando disponível ───────────────────
    private String criarCheckout(Usuario usuario, String priceId, String plano) throws StripeException {
        String customerId = usuario.getStripeCustomerId();

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(priceId).setQuantity(1L).build())
                .putMetadata("usuarioId", usuario.getId().toString())
                .putMetadata("plano", plano)
                .setSuccessUrl(appUrl + "/upgrade/sucesso?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(appUrl + "/planos");

        // Vincula ao customer existente — garante histórico unificado
        if (customerId != null && !customerId.isBlank()) {
            builder.setCustomer(customerId);
        } else {
            builder.setCustomerEmail(usuario.getEmail());
        }

        Session session = Session.create(builder.build());
        log.info("Checkout {} criado para: {} — session: {}", plano, usuario.getEmail(), session.getId());
        return session.getUrl();
    }

    // ── Status da assinatura — relê do banco ──────────────────────────────────
    public Map<String, Object> getStatusAssinatura(Usuario usuario) {
        Usuario fresh = usuarioRepository.findById(usuario.getId()).orElse(usuario);
        String status    = fresh.getAssinaturaStatus() != null ? fresh.getAssinaturaStatus() : "SEM_ASSINATURA";
        LocalDate expira = fresh.getAssinaturaExpiraEm();

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("status",    status);
        result.put("expiresAt", expira != null
                ? expira.atStartOfDay(ZoneId.of("America/Sao_Paulo")).toEpochSecond()
                : null);
        return result;
    }

    // ── Cancelamento ao fim do período ────────────────────────────────────────
    public Map<String, Object> cancelarAssinatura(Usuario usuario) throws StripeException {
        com.stripe.model.Subscription subscription = buscarAssinaturaAtiva(usuario);
        subscription.update(
                com.stripe.param.SubscriptionUpdateParams.builder()
                        .setCancelAtPeriodEnd(true)
                        .build()
        );

        long expiresAtUnix = subscription.getCurrentPeriodEnd();
        LocalDate expiraEm = Instant.ofEpochSecond(expiresAtUnix)
                .atZone(ZoneId.of("America/Sao_Paulo"))
                .toLocalDate();

        usuario.setAssinaturaStatus("CANCELANDO");
        usuario.setAssinaturaExpiraEm(expiraEm);
        usuarioRepository.save(usuario);

        log.info("Assinatura CANCELANDO para: {} — expira: {}", usuario.getEmail(), expiraEm);

        return Map.of(
                "mensagem",  "Assinatura cancelada com sucesso.",
                "expiresAt", expiresAtUnix,
                "expiraEm",  expiraEm.toString()
        );
    }

    // ── Histórico de pagamentos ───────────────────────────────────────────────
    public List<Map<String, Object>> historicoPageamentos(Usuario usuario) throws StripeException {
        String customerId = resolverCustomerId(usuario);
        if (customerId == null) return List.of();

        // Busca via Invoices — cobre assinaturas, upgrades e prorations
        com.stripe.param.InvoiceListParams invParams =
                com.stripe.param.InvoiceListParams.builder()
                        .setCustomer(customerId)
                        .setLimit(20L)
                        .build();

        return com.stripe.model.Invoice.list(invParams).getData().stream()
                .filter(inv -> "paid".equals(inv.getStatus()))
                .map(inv -> {
                    Map<String, Object> item = new java.util.LinkedHashMap<>();
                    item.put("id",        inv.getId());
                    item.put("valor",     inv.getAmountPaid());
                    item.put("moeda",     inv.getCurrency());
                    item.put("status",    inv.getStatus());
                    item.put("descricao", resolverDescricaoInvoice(inv));
                    item.put("criadoEm",  inv.getCreated());
                    item.put("pdfUrl",    inv.getInvoicePdf());
                    return item;
                })
                .toList();
    }

    // ── Busca assinatura ativa no Stripe ──────────────────────────────────────
    private com.stripe.model.Subscription buscarAssinaturaAtiva(Usuario usuario) throws StripeException {
        String customerId = resolverCustomerId(usuario);
        if (customerId == null) throw new IllegalStateException("Nenhuma assinatura ativa encontrada");

        com.stripe.param.SubscriptionListParams subParams =
                com.stripe.param.SubscriptionListParams.builder()
                        .setCustomer(customerId)
                        .setStatus(com.stripe.param.SubscriptionListParams.Status.ACTIVE)
                        .setLimit(1L)
                        .build();

        com.stripe.model.SubscriptionCollection subscriptions =
                com.stripe.model.Subscription.list(subParams);

        if (subscriptions.getData().isEmpty())
            throw new IllegalStateException("Nenhuma assinatura ativa encontrada");

        return subscriptions.getData().get(0);
    }

    // ── Resolve customerId — banco primeiro, fallback por email ───────────────
    private String resolverCustomerId(Usuario usuario) throws StripeException {
        if (usuario.getStripeCustomerId() != null && !usuario.getStripeCustomerId().isBlank()) {
            return usuario.getStripeCustomerId();
        }

        com.stripe.param.CustomerListParams cp = com.stripe.param.CustomerListParams.builder()
                .setEmail(usuario.getEmail()).setLimit(1L).build();
        com.stripe.model.CustomerCollection customers = com.stripe.model.Customer.list(cp);
        if (customers.getData().isEmpty()) return null;

        String customerId = customers.getData().get(0).getId();
        usuario.setStripeCustomerId(customerId);
        usuarioRepository.save(usuario);
        return customerId;
    }

    // ── Webhook ───────────────────────────────────────────────────────────────
    public void processarWebhook(String payload, String sigHeader) throws SignatureVerificationException {
        Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        log.info("Webhook Stripe: {}", event.getType());

        switch (event.getType()) {

            case "checkout.session.completed" -> {
                try {
                    String sessionId = extractId(event.getData().getObject().toJson());
                    if (sessionId == null) { log.warn("session_id nulo"); break; }

                    Session session   = Session.retrieve(sessionId);
                    String usuarioId  = session.getMetadata() != null ? session.getMetadata().get("usuarioId") : null;
                    String plano      = session.getMetadata() != null
                            ? session.getMetadata().getOrDefault("plano", "pro") : "pro";
                    String subId      = session.getSubscription();
                    String customerId = session.getCustomer();

                    if (usuarioId == null) { log.warn("usuarioId ausente: {}", sessionId); break; }

                    UUID planoId = "whallet-plus".equals(plano) ? PLANO_WHALLET_PLUS : PLANO_PRO;
                    ativarPlano(UUID.fromString(usuarioId), planoId, subId, customerId, plano);

                } catch (StripeException e) {
                    log.error("Erro checkout.session.completed: {}", e.getMessage());
                    throw new RuntimeException("Erro ao processar checkout", e);
                }
            }

            case "customer.subscription.updated" -> {
                // Detecta upgrade via subscription update (Pro→Plus)
                // e também detecta reativação de cancelamento (quando user remove o cancel agendado)
                try {
                    String subscriptionJson = event.getData().getObject().toJson();
                    String subscriptionId   = extractId(subscriptionJson);
                    String customerId       = extrairCampo(subscriptionJson, "customer");

                    // FIX A3.8.2: parsing robusto que tolera espaços no JSON
                    // (.contains() falhava quando Stripe enviava com espaço após dois-pontos)
                    boolean cancelAtEnd     = extrairBoolean(subscriptionJson, "cancel_at_period_end");
                    String stripeStatus     = extrairCampo(subscriptionJson, "status");

                    if (subscriptionId == null) break;

                    // Verifica se o price do item mudou para Whallet+
                    // (upgrade via API — sem checkout)
                    if (subscriptionJson.contains(priceIdWhalletPlus) && !priceIdWhalletPlus.isBlank()) {
                        String usuarioIdMeta = extrairMetadata(subscriptionJson, "usuarioId");
                        if (usuarioIdMeta != null) {
                            ativarPlano(UUID.fromString(usuarioIdMeta), PLANO_WHALLET_PLUS,
                                    subscriptionId, customerId, "whallet-plus");
                            log.info("Upgrade via subscription.updated detectado: {}", subscriptionId);
                            break;
                        }
                    }

                    // Reativação de cancelamento
                    // FIX A3.8.2: só reverte se status do Stripe = "active" E cancel_at_period_end=false
                    // (evita reverter durante webhooks fantasmas após o cancelamento)
                    if (!cancelAtEnd && "active".equals(stripeStatus)) {
                        usuarioRepository.findByStripeSubscriptionId(subscriptionId).ifPresent(u -> {
                            if ("CANCELANDO".equals(u.getAssinaturaStatus())) {
                                u.setAssinaturaStatus("ATIVA");
                                u.setAssinaturaExpiraEm(null);
                                usuarioRepository.save(u);
                                log.info("Cancelamento revertido: {}", u.getEmail());
                            }
                        });
                    }
                } catch (Exception e) {
                    log.error("Erro subscription.updated: {}", e.getMessage());
                }
            }

            case "customer.subscription.deleted" -> {
                try {
                    String subscriptionJson = event.getData().getObject().toJson();
                    String subscriptionId   = extractId(subscriptionJson);
                    String customerId       = extrairCampo(subscriptionJson, "customer");

                    if (customerId == null) break;

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
                    if (usuario == null) { log.warn("Usuário não encontrado: {}", subscriptionId); break; }

                    // Só rebaixa se ainda está em plano pago (não foi upgrade)
                    if (PLANO_PRO.equals(usuario.getPlanoId()) || PLANO_WHALLET_PLUS.equals(usuario.getPlanoId())) {
                        usuario.setPlanoId(PLANO_GRATUITO);
                        usuario.setAssinaturaStatus("EXPIRADA");
                        usuario.setStripeSubscriptionId(null);
                        usuarioRepository.save(usuario);
                        log.info("Plano expirado → gratuito: {}", usuario.getEmail());
                    } else {
                        log.info("subscription.deleted ignorado (plano já mudou): {}", usuario.getEmail());
                    }
                } catch (Exception e) {
                    log.error("Erro subscription.deleted: {}", e.getMessage());
                }
            }

            case "invoice.payment_failed" -> {
                try {
                    String invoiceJson = event.getData().getObject().toJson();
                    String customerId  = extrairCampo(invoiceJson, "customer");
                    if (customerId != null) {
                        com.stripe.model.Customer customer = com.stripe.model.Customer.retrieve(customerId);
                        if (customer.getEmail() != null) {
                            log.warn("Pagamento falhou: {} — verificar no Stripe", customer.getEmail());
                        }
                    }
                } catch (Exception e) {
                    log.error("Erro invoice.payment_failed: {}", e.getMessage());
                }
            }

            default -> log.debug("Evento ignorado: {}", event.getType());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void ativarPlano(UUID usuarioId, UUID planoId, String subscriptionId,
                             String customerId, String nomePlano) {
        usuarioRepository.findById(usuarioId).ifPresentOrElse(usuario -> {
            usuario.setPlanoId(planoId);
            usuario.setAssinaturaStatus("ATIVA");
            usuario.setAssinaturaExpiraEm(null);
            if (subscriptionId != null) usuario.setStripeSubscriptionId(subscriptionId);
            if (customerId     != null) usuario.setStripeCustomerId(customerId);
            usuarioRepository.save(usuario);
            log.info("Plano {} ativado: {}", nomePlano, usuario.getEmail());
        }, () -> log.error("Usuário não encontrado ao ativar {}: {}", nomePlano, usuarioId));
    }

    private String resolverDescricaoInvoice(com.stripe.model.Invoice inv) {
        if (inv.getLines() != null && !inv.getLines().getData().isEmpty()) {
            String desc = inv.getLines().getData().get(0).getDescription();
            if (desc != null && !desc.isBlank()) return desc;
        }
        return "Assinatura Whallet";
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
            // Tolera espaços: "campo":"valor" ou "campo": "valor"
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(
                    "\"" + java.util.regex.Pattern.quote(campo) + "\"\\s*:\\s*\"([^\"]+)\""
            );
            java.util.regex.Matcher m = p.matcher(json);
            return m.find() ? m.group(1) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String extrairMetadata(String json, String chave) {
        try {
            String search = "\"" + chave + "\": \"";
            int idx = json.indexOf(search);
            if (idx < 0) {
                search = "\"" + chave + "\":\"";
                idx = json.indexOf(search);
            }
            if (idx < 0) return null;
            int start = idx + search.length();
            int end   = json.indexOf("\"", start);
            return json.substring(start, end);
        } catch (Exception e) { return null; }
    }

    /**
     * Extrai um campo boolean do JSON do Stripe de forma robusta.
     * Tolera espaços, quebras de linha e diferentes formatações.
     *
     * Exemplos que funcionam:
     *   "cancel_at_period_end":true
     *   "cancel_at_period_end": true
     *   "cancel_at_period_end" : true
     *
     * Adicionado em A3.8.2 — fix do bug de cancelamento sobrescrito por webhook.
     */
    private boolean extrairBoolean(String json, String campo) {
        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(
                    "\"" + java.util.regex.Pattern.quote(campo) + "\"\\s*:\\s*(true|false)"
            );
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return Boolean.parseBoolean(m.group(1));
            }
            return false;
        } catch (Exception e) {
            log.warn("Erro ao extrair boolean '{}': {}", campo, e.getMessage());
            return false;
        }
    }
}