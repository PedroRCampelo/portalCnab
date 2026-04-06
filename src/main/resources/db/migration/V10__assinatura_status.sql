-- V11: Campos de controle de assinatura na tabela usuarios
-- Permite rastrear status sem depender de chamadas ao Stripe em tempo real

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS assinatura_status    VARCHAR(20)  DEFAULT 'SEM_ASSINATURA',
    ADD COLUMN IF NOT EXISTS assinatura_expira_em DATE,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS stripe_customer_id     VARCHAR(100);

-- Atualiza registros existentes com base no plano_id atual
UPDATE usuarios SET assinatura_status = 'ATIVA'
WHERE plano_id IN (
                   '10000000-0000-0000-0000-000000000002',
                   '10000000-0000-0000-0000-000000000003'
    );

UPDATE usuarios SET assinatura_status = 'SEM_ASSINATURA'
WHERE plano_id = '10000000-0000-0000-0000-000000000001'
   OR plano_id IS NULL;

-- Index para buscas por subscription_id no webhook
CREATE INDEX IF NOT EXISTS idx_usuarios_stripe_subscription
    ON usuarios (stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_stripe_customer
    ON usuarios (stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;