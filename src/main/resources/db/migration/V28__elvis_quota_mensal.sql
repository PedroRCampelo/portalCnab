-- ═════════════════════════════════════════════════════════════════════════════
-- V28 — Quota mensal do Elvis (IA do CNAB) — Sprint A3.9
--
-- Implementa o gate de uso do Elvis baseado em plano:
--   - Free        → 5 perguntas/mês
--   - Whallet+    → ilimitado (NULL na coluna)
--
-- Estrutura:
--   1. Adiciona coluna `elvis_quota_mensal` na tabela `planos`
--      → NULL    = ilimitado
--      → INTEGER = limite mensal
--
--   2. Cria tabela `elvis_uso_mensal` com 1 linha por usuário/mês
--      → ano_mes formato 'YYYY-MM' (ex: '2026-04')
--      → contador incrementa a cada pergunta
--      → reset automático: novo mês = nova linha
--
-- Decisão de design:
--   - Reset NÃO precisa de cron job — chave (usuario_id, ano_mes) garante
--     que cada mês começa do zero automaticamente
--   - Auditoria: histórico fica preservado pra analytics futuros
--     (quantas perguntas em janeiro? quem usa mais?)
-- ═════════════════════════════════════════════════════════════════════════════


-- ─── 1. Coluna elvis_quota_mensal nos planos ─────────────────────────────────
ALTER TABLE planos
    ADD COLUMN elvis_quota_mensal INTEGER;

COMMENT ON COLUMN planos.elvis_quota_mensal IS
    'Limite mensal de perguntas ao Elvis. NULL = ilimitado.';

-- Popula valores baseado no plano
UPDATE planos SET elvis_quota_mensal = 5    WHERE slug = 'gratuito';      -- Free: 5/mês
UPDATE planos SET elvis_quota_mensal = NULL WHERE slug = 'whallet-plus';  -- Plus: ilimitado


-- ─── 2. Tabela elvis_uso_mensal ──────────────────────────────────────────────
CREATE TABLE elvis_uso_mensal (
                                  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                                  usuario_id    UUID         NOT NULL,
                                  ano_mes       VARCHAR(7)   NOT NULL,            -- formato 'YYYY-MM'
                                  contador      INTEGER      NOT NULL DEFAULT 0,
                                  primeira_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                                  ultima_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

                                  CONSTRAINT fk_elvis_uso_usuario FOREIGN KEY (usuario_id)
                                      REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Garante 1 linha por usuário/mês (chave do reset automático)
                                  CONSTRAINT uk_elvis_uso_usuario_mes UNIQUE (usuario_id, ano_mes),

    -- Defensivo: contador não-negativo
                                  CONSTRAINT ck_elvis_uso_contador_positivo CHECK (contador >= 0)
);

-- Índice pra queries por usuário (lookup do mês corrente)
CREATE INDEX ix_elvis_uso_usuario_mes ON elvis_uso_mensal (usuario_id, ano_mes);

COMMENT ON TABLE  elvis_uso_mensal IS
    'Contador mensal de perguntas ao Elvis. Reset automático: nova linha por mês.';
COMMENT ON COLUMN elvis_uso_mensal.ano_mes IS
    'Formato YYYY-MM (ex: 2026-04). Permite reset automático sem cron.';
COMMENT ON COLUMN elvis_uso_mensal.contador IS
    'Quantidade de perguntas feitas no mês.';
COMMENT ON COLUMN elvis_uso_mensal.primeira_em IS
    'Timestamp da primeira pergunta do mês.';
COMMENT ON COLUMN elvis_uso_mensal.ultima_em IS
    'Timestamp da pergunta mais recente.';