-- Tabela de cargas (agrupamento de pedidos para roteirização)
CREATE TABLE cargas (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    empresa_id      UUID        NOT NULL REFERENCES empresas(id),
    numero          VARCHAR(20) NOT NULL,
    descricao       VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'ABERTA',
    endereco_origem VARCHAR(500),
    criado_em       TIMESTAMP   NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMP   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX idx_cargas_empresa ON cargas(empresa_id);

-- Campos adicionados ao pedido de venda para roteirização
ALTER TABLE pedidos_venda
    ADD COLUMN carga_id          UUID        REFERENCES cargas(id),
    ADD COLUMN endereco_entrega  VARCHAR(500);

CREATE INDEX idx_pedidos_venda_carga ON pedidos_venda(carga_id);

-- Numerador CRG para empresas já existentes
INSERT INTO empresa_numeradores (empresa_id, tipo, ultimo)
SELECT id, 'CRG', 0 FROM empresas
ON CONFLICT (empresa_id, tipo) DO NOTHING;
