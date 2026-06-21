-- V45: Logo e dados de contato da empresa (para orçamento PDF e topbar)

ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS logo_base64   TEXT,
    ADD COLUMN IF NOT EXISTS telefone      VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email_empresa VARCHAR(150);
