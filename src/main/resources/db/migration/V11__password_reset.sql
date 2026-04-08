-- V11: campos de redefinição de senha na tabela usuarios

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS token_redefinicao          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS token_redefinicao_expiracao TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_usuarios_token_redefinicao
    ON usuarios (token_redefinicao)
    WHERE token_redefinicao IS NOT NULL;