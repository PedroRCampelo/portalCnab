-- V37: Vinculação WhatsApp — código de verificação
-- Fluxo: usuário informa número no app → sistema envia código via WhatsApp → usuário responde → vincula

ALTER TABLE whatsapp_sessoes ADD COLUMN IF NOT EXISTS codigo_verificacao VARCHAR(6);
ALTER TABLE whatsapp_sessoes ADD COLUMN IF NOT EXISTS verificada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE whatsapp_sessoes ADD COLUMN IF NOT EXISTS codigo_expira_em TIMESTAMP;