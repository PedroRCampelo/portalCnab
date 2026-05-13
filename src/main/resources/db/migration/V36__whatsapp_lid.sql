-- V36: Sprint WA-1 fix — campo LID na sessão WhatsApp
-- O WhatsApp usa LID (Linked ID) em vez de número real nas mensagens.
-- Precisamos mapear LID → número real pra responder.

ALTER TABLE whatsapp_sessoes ADD COLUMN IF NOT EXISTS lid VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_wa_sessao_lid ON whatsapp_sessoes(lid, ativa);