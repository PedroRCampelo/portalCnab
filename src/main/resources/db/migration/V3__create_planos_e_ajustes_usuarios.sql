-- V3: Planos de assinatura e ajustes na tabela de usuarios
--
-- Planos iniciais:
--   gratuito  — 8 arquivos/mes, R$ 0
--   pro       — ilimitado, R$ 18,90/mes

CREATE TABLE planos (
                        id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                        nome            VARCHAR(50) NOT NULL UNIQUE,  -- 'gratuito' | 'pro' | 'protheus'
                        descricao       VARCHAR(200),
                        limite_mensal   INTEGER     NOT NULL DEFAULT 8,  -- -1 = ilimitado
                        preco_mensal    NUMERIC(10,2) NOT NULL DEFAULT 0,
                        ativo           BOOLEAN     NOT NULL DEFAULT TRUE,
                        criado_em       TIMESTAMP   NOT NULL DEFAULT NOW()
);

INSERT INTO planos (id, nome, descricao, limite_mensal, preco_mensal) VALUES
                                                                          ('10000000-0000-0000-0000-000000000001', 'gratuito', 'Acesso basico com limite mensal', 8, 0.00),
                                                                          ('10000000-0000-0000-0000-000000000002', 'pro',      'Acesso ilimitado ao Excel e PDF', -1, 18.90);

-- Ajustes na tabela usuarios
ALTER TABLE usuarios
    ADD COLUMN plano_id         UUID      REFERENCES planos(id) DEFAULT '10000000-0000-0000-0000-000000000001',
    ADD COLUMN email_verificado BOOLEAN   NOT NULL DEFAULT FALSE,
    ADD COLUMN token_verificacao VARCHAR(255),
    ADD COLUMN token_expiracao  TIMESTAMP,
    ADD COLUMN usos_mes_atual   INTEGER   NOT NULL DEFAULT 0,
    ADD COLUMN mes_referencia   VARCHAR(7);  -- formato: '2026-04'

-- Usuarios criados pelo admin ja nascem verificados e no plano pro
UPDATE usuarios
SET email_verificado = TRUE,
    plano_id = '10000000-0000-0000-0000-000000000002'
WHERE perfil = 'ADMIN' OR perfil = 'OPERADOR';

COMMENT ON COLUMN planos.limite_mensal    IS '-1 = ilimitado';
COMMENT ON COLUMN usuarios.mes_referencia IS 'Mes de referencia da contagem: YYYY-MM';
COMMENT ON COLUMN usuarios.token_verificacao IS 'Token UUID para confirmar o email — apagado apos uso';