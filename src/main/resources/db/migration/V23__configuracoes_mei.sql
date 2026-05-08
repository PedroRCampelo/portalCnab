-- ═════════════════════════════════════════════════════════════════════════════
-- V23 — Configurações MEI (Sprint 2.2)
--
-- Adiciona:
--   1. Configurações tributárias na tabela empresas (limite anual, DAS)
--   2. Campo tipo_especial em titulos para diferenciar DAS de outros títulos
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Empresa: configurações MEI ──────────────────────────────────────────────

-- Limite anual de faturamento MEI (configurável pelo MEI no perfil)
-- Padrão: R$ 81.000 (regra atual). MEI pode ajustar se a regra mudar.
ALTER TABLE empresas
    ADD COLUMN limite_anual_mei NUMERIC(18, 2) NOT NULL DEFAULT 81000.00;

-- Toggle: MEI ativou o controle de DAS no Whallet?
-- Default false — não cria DAS automaticamente pra todo mundo
ALTER TABLE empresas
    ADD COLUMN das_ativo BOOLEAN NOT NULL DEFAULT false;

-- Categoria do DAS (define valor mensal padrão):
--   COMERCIO_INDUSTRIA → R$ 76,90 (paga ICMS)
--   SERVICOS           → R$ 80,90 (paga ISS)
--   AMBOS              → R$ 81,90 (paga ICMS + ISS)
-- Null se das_ativo = false
ALTER TABLE empresas
    ADD COLUMN das_categoria VARCHAR(20);

-- Valor mensal do DAS (override manual se o município tiver valor diferente)
-- Null usa valor padrão da categoria
ALTER TABLE empresas
    ADD COLUMN das_valor_mensal NUMERIC(18, 2);

-- Constraint: se das_ativo = true, das_categoria não pode ser null
ALTER TABLE empresas
    ADD CONSTRAINT chk_das_categoria_consistencia
        CHECK (
            das_ativo = false OR das_categoria IS NOT NULL
            );

-- Constraint: das_categoria só aceita valores válidos
ALTER TABLE empresas
    ADD CONSTRAINT chk_das_categoria_valida
        CHECK (
            das_categoria IS NULL OR das_categoria IN ('COMERCIO_INDUSTRIA', 'SERVICOS', 'AMBOS')
            );


-- ── Título: tipo especial ───────────────────────────────────────────────────

-- Diferencia título normal (NULL) de DAS (DAS) ou outros tipos especiais futuros.
-- Nullable — títulos comuns ficam com NULL.
ALTER TABLE titulos
    ADD COLUMN tipo_especial VARCHAR(20);

-- Constraint: tipo_especial só aceita valores conhecidos (extensível)
ALTER TABLE titulos
    ADD CONSTRAINT chk_titulo_tipo_especial
        CHECK (
            tipo_especial IS NULL OR tipo_especial IN ('DAS')
            );

-- Índice pra acelerar filtragem de DAS (Aba DAS, oculta DAS no /titulos comum)
CREATE INDEX idx_titulos_tipo_especial
    ON titulos(empresa_id, tipo_especial)
    WHERE tipo_especial IS NOT NULL;