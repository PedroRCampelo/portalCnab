-- V39: Impede dois usuários de vincular o mesmo número de WhatsApp.
--
-- Partial unique index: apenas sessões ativas E verificadas contam.
-- Se o user A desvincular (ativa=false), o telefone fica livre.

-- Primeiro, desativa duplicatas existentes (mantém a mais recente)
UPDATE whatsapp_sessoes s
SET    ativa = FALSE
WHERE  s.ativa = TRUE
  AND  s.verificada = TRUE
  AND  EXISTS (
    SELECT 1 FROM whatsapp_sessoes s2
    WHERE  s2.telefone = s.telefone
      AND  s2.ativa = TRUE
      AND  s2.verificada = TRUE
      AND  s2.criado_em > s.criado_em
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_telefone_ativo_verificado
    ON whatsapp_sessoes (telefone)
    WHERE ativa = TRUE AND verificada = TRUE;