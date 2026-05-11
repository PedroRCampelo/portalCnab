-- ═════════════════════════════════════════════════════════════════════════════
-- V30 — Trial 7 dias Whallet+ (opt-in)
--
-- Estrutura:
--   - trial_inicio_em     → quando ativou o trial (null = nunca ativou)
--   - trial_expira_em     → quando expira (trial_inicio_em + 7 dias)
--   - trial_utilizado     → flag pra impedir reuso (1 trial por conta)
--
-- Fluxo:
--   1. User cadastra → plano Free (sem mudança)
--   2. User clica "Experimentar grátis 7 dias" → ativa trial
--      → plano_id = whallet-plus
--      → assinatura_status = 'TRIAL'
--      → trial_inicio_em = now()
--      → trial_expira_em = now() + 7 days
--      → trial_utilizado = true
--   3. Após 7 dias (check on-demand ou scheduled):
--      → plano_id = gratuito
--      → assinatura_status = 'SEM_ASSINATURA'
--
-- assinatura_status ganha novo valor: 'TRIAL'
-- ═════════════════════════════════════════════════════════════════════════════

-- Campos de trial
ALTER TABLE usuarios
    ADD COLUMN trial_inicio_em TIMESTAMPTZ;

ALTER TABLE usuarios
    ADD COLUMN trial_expira_em TIMESTAMPTZ;

ALTER TABLE usuarios
    ADD COLUMN trial_utilizado BOOLEAN NOT NULL DEFAULT false;

-- Comentários
COMMENT ON COLUMN usuarios.trial_inicio_em IS
    'Quando o trial de 7 dias foi ativado. NULL = nunca ativou.';

COMMENT ON COLUMN usuarios.trial_expira_em IS
    'Quando o trial expira. trial_inicio_em + 7 days.';

COMMENT ON COLUMN usuarios.trial_utilizado IS
    'Flag que impede reuso do trial. TRUE = já usou (mesmo que tenha expirado).';