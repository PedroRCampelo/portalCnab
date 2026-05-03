-- ═════════════════════════════════════════════════════════════════════════════
-- V29 — Fair use do Elvis no Whallet+ (Sprint A3.9.4)
--
-- Decisão de produto:
-- Mesmo Whallet+ precisa ter limite mensal pra evitar:
--   - Drenagem do budget Anthropic API (~$0.003/pergunta)
--   - Sobrecarga do servidor por usuário malicioso
--   - "Vazamento" do serviço (revenda de acesso)
--
-- Limites:
--   - Free        →   5 perguntas/mês
--   - Whallet+    → 100 perguntas/mês  (era NULL/ilimitado)
--   - Admin       → ilimitado (lógica no service, não no banco)
--
-- Comunicação ao usuário:
--   "Ilimitado" no marketing/planos (estilo SaaS).
--   Badge só aparece quando usadas >= 80 (80% do limite).
--   Footnote sutil "uso justo aplicado" em pricing/FAQ.
-- ═════════════════════════════════════════════════════════════════════════════

UPDATE planos
SET    elvis_quota_mensal = 100
WHERE  slug = 'whallet-plus';

-- Documentar a mudança
COMMENT ON COLUMN planos.elvis_quota_mensal IS
    'Limite mensal de perguntas ao Elvis. NULL = ilimitado (não usado em produção - admin é tratado no service).';