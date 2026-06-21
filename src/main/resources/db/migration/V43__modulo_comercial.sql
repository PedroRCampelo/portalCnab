-- V43: Módulo Comercial — Orçamentos e Pedidos de Venda
-- Integração com financeiro: efetivar pedido gera recebimentos automaticamente.

-- ── Orçamentos ────────────────────────────────────────────────────────────────

CREATE TABLE orcamentos (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      UUID        NOT NULL REFERENCES empresas(id),
    usuario_id      UUID        NOT NULL REFERENCES usuarios(id),
    cliente_id      UUID        NOT NULL REFERENCES clientes(id),
    numero          VARCHAR(20) NOT NULL,

    -- RASCUNHO | ENVIADO | APROVADO | RECUSADO | EXPIRADO
    status          VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO',

    validade        DATE        NOT NULL,
    descricao       VARCHAR(255),
    observacoes     TEXT,
    valor_total     NUMERIC(18,2) NOT NULL DEFAULT 0,
    desconto_geral  NUMERIC(18,2) NOT NULL DEFAULT 0,

    -- Auditoria
    criado_por_id   UUID REFERENCES usuarios(id),
    alterado_por_id UUID REFERENCES usuarios(id),
    cancelado_por_id UUID REFERENCES usuarios(id),
    cancelado_em    TIMESTAMP,
    aprovado_em     TIMESTAMP,

    criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE itens_orcamento (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id    UUID        NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
    descricao       VARCHAR(255) NOT NULL,
    quantidade      NUMERIC(10,3) NOT NULL DEFAULT 1,
    valor_unitario  NUMERIC(18,2) NOT NULL,
    desconto        NUMERIC(18,2) NOT NULL DEFAULT 0,
    subtotal        NUMERIC(18,2) NOT NULL,
    ordem           INTEGER NOT NULL DEFAULT 0
);

-- ── Pedidos de Venda ──────────────────────────────────────────────────────────

CREATE TABLE pedidos_venda (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id          UUID        NOT NULL REFERENCES empresas(id),
    usuario_id          UUID        NOT NULL REFERENCES usuarios(id),
    cliente_id          UUID        NOT NULL REFERENCES clientes(id),
    orcamento_id        UUID        REFERENCES orcamentos(id),
    numero              VARCHAR(20) NOT NULL,

    -- ABERTO | EFETIVADO | CANCELADO
    status              VARCHAR(20) NOT NULL DEFAULT 'ABERTO',

    descricao           VARCHAR(255),
    observacoes         TEXT,
    valor_total         NUMERIC(18,2) NOT NULL DEFAULT 0,

    -- Condições de pagamento
    forma_pagamento     VARCHAR(20) NOT NULL DEFAULT 'PIX',
    num_parcelas        INTEGER NOT NULL DEFAULT 1,
    intervalo_dias      INTEGER NOT NULL DEFAULT 30,
    primeiro_vencimento DATE NOT NULL,
    categoria_id        UUID REFERENCES categorias(id),

    -- Auditoria
    criado_por_id       UUID REFERENCES usuarios(id),
    alterado_por_id     UUID REFERENCES usuarios(id),
    efetivado_por_id    UUID REFERENCES usuarios(id),
    efetivado_em        TIMESTAMP,
    cancelado_por_id    UUID REFERENCES usuarios(id),
    cancelado_em        TIMESTAMP,

    criado_em           TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE itens_pedido_venda (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id       UUID        NOT NULL REFERENCES pedidos_venda(id) ON DELETE CASCADE,
    descricao       VARCHAR(255) NOT NULL,
    quantidade      NUMERIC(10,3) NOT NULL DEFAULT 1,
    valor_unitario  NUMERIC(18,2) NOT NULL,
    desconto        NUMERIC(18,2) NOT NULL DEFAULT 0,
    subtotal        NUMERIC(18,2) NOT NULL,
    ordem           INTEGER NOT NULL DEFAULT 0
);

-- Sequences para numeração legível
CREATE SEQUENCE orcamento_numero_seq START 1;
CREATE SEQUENCE pedido_venda_numero_seq START 1;

-- Índices
CREATE INDEX idx_orcamentos_empresa   ON orcamentos(empresa_id);
CREATE INDEX idx_orcamentos_cliente   ON orcamentos(cliente_id);
CREATE INDEX idx_orcamentos_status    ON orcamentos(status);
CREATE INDEX idx_pedidos_empresa      ON pedidos_venda(empresa_id);
CREATE INDEX idx_pedidos_cliente      ON pedidos_venda(cliente_id);
CREATE INDEX idx_pedidos_status       ON pedidos_venda(status);
CREATE INDEX idx_pedidos_orcamento    ON pedidos_venda(orcamento_id);
