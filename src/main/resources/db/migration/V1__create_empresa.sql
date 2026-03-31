-- ─────────────────────────────────────────────────────────────────────────────
-- Migration V1: Criação da tabela empresas
--
-- Por que UUID como PK?
--   IDs sequenciais (1, 2, 3...) são previsíveis — um usuário malicioso pode
--   tentar acessar /api/empresas/2 para ver dados de outro cliente.
--   UUIDs são aleatórios e impossíveis de adivinhar.
--
-- Por que esta tabela primeiro?
--   Usuários pertencem a uma empresa (empresa_id FK em usuarios).
--   Flyway exige que a tabela referenciada exista antes da que referencia.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE empresas (
                          id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
                          nome        VARCHAR(150) NOT NULL,
                          cnpj        VARCHAR(18)  NOT NULL UNIQUE,  -- formato: XX.XXX.XXX/XXXX-XX
                          ativa       BOOLEAN      NOT NULL DEFAULT TRUE,
                          criada_em   TIMESTAMP    NOT NULL DEFAULT NOW(),
                          atualizada_em TIMESTAMP  NOT NULL DEFAULT NOW()
);

-- Índice no CNPJ: buscas por CNPJ são frequentes (login, validação)
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);

-- Índice em ativa: filtrar apenas empresas ativas é operação comum
CREATE INDEX idx_empresas_ativa ON empresas(ativa);

COMMENT ON TABLE  empresas              IS 'Empresas cadastradas no sistema';
COMMENT ON COLUMN empresas.cnpj         IS 'CNPJ formatado: XX.XXX.XXX/XXXX-XX';
COMMENT ON COLUMN empresas.ativa        IS 'false = empresa desativada, não acessa o sistema';