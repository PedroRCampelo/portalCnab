-- V9: campo data_baixa em titulos + tabela tipos_gasto por empresa/usuario

-- 1. Data da baixa no título
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS data_baixa DATE;

-- 2. Tabela de tipos de gasto (exclusiva por empresa/usuario)
CREATE TABLE IF NOT EXISTS tipos_gasto (
                                           id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome       VARCHAR(100) NOT NULL,
    empresa_id UUID         NOT NULL REFERENCES empresas(id),
    usuario_id UUID         NOT NULL REFERENCES usuarios(id),
    ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em  TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tipo_gasto_nome_usuario UNIQUE (nome, usuario_id)
    );

-- 3. FK em titulos para tipo de gasto (opcional)
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS tipo_gasto_id UUID REFERENCES tipos_gasto(id) ON DELETE SET NULL;