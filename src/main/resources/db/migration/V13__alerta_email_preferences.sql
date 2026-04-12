-- V13: Preferências de alertas de e-mail por usuário

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS alerta_vencidos      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS alerta_a_vencer      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS alerta_dias_antes     INTEGER          DEFAULT 3,
    ADD COLUMN IF NOT EXISTS alerta_ultimo_envio   DATE;

-- Índice para o scheduler buscar só quem quer receber alertas
CREATE INDEX IF NOT EXISTS idx_usuarios_alerta
    ON usuarios (alerta_vencidos, alerta_a_vencer)
    WHERE alerta_vencidos = TRUE OR alerta_a_vencer = TRUE;