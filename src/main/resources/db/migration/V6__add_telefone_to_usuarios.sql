-- V6: Adiciona campo de telefone opcional aos usuarios
-- Util para contato comercial e possíveis notificações futuras

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS telefone VARCHAR(20) NULL;

COMMENT ON COLUMN usuarios.telefone IS 'Telefone opcional — formato livre, ex: (11) 99999-9999';