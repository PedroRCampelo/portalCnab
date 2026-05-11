-- V32: Sprint F1.2 — Categorias unificadas (receitas e despesas)
--
-- Substitui tipos_gasto por tabela categorias unificada.
-- Cada categoria tem tipo: RECEITA, DESPESA ou AMBOS.
-- FK categoria_id adicionada em recebimentos e titulos.
-- Dados existentes de tipos_gasto migrados automaticamente.

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABELA CATEGORIAS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS categorias (
                                          id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id  UUID            NOT NULL REFERENCES empresas(id),
    nome        VARCHAR(100)    NOT NULL,
    tipo        VARCHAR(10)     NOT NULL DEFAULT 'AMBOS',
    cor         VARCHAR(7),
    ativo       BOOLEAN         NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

-- Constraints
ALTER TABLE categorias ADD CONSTRAINT chk_categoria_tipo
    CHECK (tipo IN ('RECEITA', 'DESPESA', 'AMBOS'));

-- Nome único por empresa + tipo (evita duplicar "Aluguel" como RECEITA e "Aluguel" como DESPESA separadamente, mas permite se forem tipos diferentes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cat_empresa_nome_tipo
    ON categorias(empresa_id, LOWER(nome), tipo)
    WHERE ativo = TRUE;

-- Índices de busca
CREATE INDEX IF NOT EXISTS idx_cat_empresa_ativo ON categorias(empresa_id, ativo);
CREATE INDEX IF NOT EXISTS idx_cat_empresa_tipo ON categorias(empresa_id, tipo, ativo);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO: tipos_gasto → categorias (como DESPESA)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO categorias (id, empresa_id, nome, tipo, ativo, criado_em)
SELECT id, empresa_id, nome, 'DESPESA', ativo, criado_em
FROM tipos_gasto
    ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FK EM RECEBIMENTOS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_receb_categoria ON recebimentos(categoria_id) WHERE categoria_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FK EM TÍTULOS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE titulos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;

-- Popula categoria_id nos títulos que já tinham tipo_gasto_id
-- (como migramos tipos_gasto → categorias preservando o UUID, o match é direto)
UPDATE titulos SET categoria_id = tipo_gasto_id WHERE tipo_gasto_id IS NOT NULL AND categoria_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_titulo_categoria ON titulos(categoria_id) WHERE categoria_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATEGORIAS PADRÃO (seed pra empresas novas — aplicadas a empresa_id existentes)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Não fazemos seed aqui pra não poluir empresas existentes.
-- Categorias padrão serão criadas no CategoriaService quando a empresa criar a primeira.