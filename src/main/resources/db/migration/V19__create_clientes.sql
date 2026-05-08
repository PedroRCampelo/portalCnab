-- V19: módulo Recebimentos — tabela clientes
--
-- Cliente é entidade própria (decisão arquitetural):
--   - Permite histórico de recebimentos por cliente
--   - Permite cálculo de score (sempre paga, sempre atrasa)
--   - Permite cobrança via WhatsApp com dados salvos
--
-- Multi-tenant: cada cliente pertence a uma empresa.
-- Soft constraint: documento (CPF/CNPJ) único por empresa quando preenchido.

BEGIN;

CREATE TABLE clientes (
                          id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Multi-tenant
                          empresa_id      UUID            NOT NULL REFERENCES empresas(id),

    -- Identificação
                          nome            VARCHAR(150)    NOT NULL,
                          documento       VARCHAR(20),                   -- CPF ou CNPJ (opcional)
                          tipo_pessoa     VARCHAR(2)      NOT NULL DEFAULT 'PF', -- PF | PJ

    -- Contato (telefone é importante pro WhatsApp)
                          email           VARCHAR(150),
                          telefone        VARCHAR(20),                   -- formato livre, normalizado no backend

    -- Categorização e notas
                          categoria       VARCHAR(50),                   -- ex: "consultoria", "produto", livre
                          notas           TEXT,                          -- observações internas do MEI

    -- Status
                          ativo           BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Auditoria
                          criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          atualizado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Documento único por empresa (quando preenchido) — evita duplicar cliente
CREATE UNIQUE INDEX idx_clientes_documento_empresa
    ON clientes(empresa_id, documento)
    WHERE documento IS NOT NULL;

-- Índices pra busca rápida
CREATE INDEX idx_clientes_empresa_ativo ON clientes(empresa_id, ativo);
CREATE INDEX idx_clientes_empresa_nome  ON clientes(empresa_id, lower(nome));

-- Constraint: tipo_pessoa válido
ALTER TABLE clientes
    ADD CONSTRAINT chk_clientes_tipo_pessoa CHECK (tipo_pessoa IN ('PF', 'PJ'));

COMMIT;