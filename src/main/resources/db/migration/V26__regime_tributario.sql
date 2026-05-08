-- ═════════════════════════════════════════════════════════════════════════════
-- V26 — Refatoração regime tributário (Sprint 2.2-A1.5)
--
-- Como não tem dados em produção, drop + recriar com nomes mais semânticos.
-- Estrutura preparada pra Simples Nacional (ME/EPP), Lucro Presumido, Real, etc.
--
-- Antes (acoplado ao MEI):
--   limite_anual_mei, das_categoria, das_valor_mensal
--
-- Depois (escalável por regime):
--   regime_tributario, limite_faturamento_anual,
--   mei_categoria, mei_valor_das_mensal
-- ═════════════════════════════════════════════════════════════════════════════


-- ── Remove constraints antigas que vão dar conflito ─────────────────────────

ALTER TABLE empresas
DROP CONSTRAINT IF EXISTS chk_das_categoria_consistencia;

ALTER TABLE empresas
DROP CONSTRAINT IF EXISTS chk_das_categoria_valida;


-- ── Drop colunas antigas (acopladas ao MEI) ─────────────────────────────────

ALTER TABLE empresas DROP COLUMN IF EXISTS limite_anual_mei;
ALTER TABLE empresas DROP COLUMN IF EXISTS das_categoria;
ALTER TABLE empresas DROP COLUMN IF EXISTS das_valor_mensal;


-- ── Adiciona estrutura nova ─────────────────────────────────────────────────

-- Regime tributário da empresa
-- Valores: NENHUM, MEI, SIMPLES_NACIONAL, LUCRO_PRESUMIDO, LUCRO_REAL, OUTRO
ALTER TABLE empresas
    ADD COLUMN regime_tributario VARCHAR(20) NOT NULL DEFAULT 'NENHUM';

-- Limite anual de faturamento (varia por regime; null = sem limite cadastrado)
-- MEI: 81.000 (regra atual)
-- ME: 360.000
-- EPP: 4.800.000
ALTER TABLE empresas
    ADD COLUMN limite_faturamento_anual NUMERIC(18, 2);

-- Sub-campo MEI: categoria
-- Valores: COMERCIO_INDUSTRIA, SERVICOS, AMBOS
-- Null se regime != MEI
ALTER TABLE empresas
    ADD COLUMN mei_categoria VARCHAR(20);

-- Sub-campo MEI: valor mensal do DAS (override pra municípios com valor diferente)
-- Null usa o valor padrão da categoria
ALTER TABLE empresas
    ADD COLUMN mei_valor_das_mensal NUMERIC(18, 2);


-- ── Constraints novas ───────────────────────────────────────────────────────

-- Regime tributário só aceita valores conhecidos
ALTER TABLE empresas
    ADD CONSTRAINT chk_regime_tributario
        CHECK (regime_tributario IN ('NENHUM', 'MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'OUTRO'));

-- Categoria MEI só faz sentido se regime = MEI
ALTER TABLE empresas
    ADD CONSTRAINT chk_mei_categoria_consistencia
        CHECK (
            (regime_tributario != 'MEI' AND mei_categoria IS NULL)
                OR
            (regime_tributario = 'MEI' AND (mei_categoria IS NULL OR mei_categoria IN ('COMERCIO_INDUSTRIA', 'SERVICOS', 'AMBOS')))
            );

-- DAS ativo + MEI = obriga categoria
ALTER TABLE empresas
    ADD CONSTRAINT chk_das_ativo_mei_categoria
        CHECK (
            das_ativo = false
                OR regime_tributario != 'MEI'
    OR mei_categoria IS NOT NULL
    );


-- ── Comentários pra documentar ──────────────────────────────────────────────

COMMENT ON COLUMN empresas.regime_tributario IS
    'Regime tributário: NENHUM, MEI, SIMPLES_NACIONAL, LUCRO_PRESUMIDO, LUCRO_REAL, OUTRO';

COMMENT ON COLUMN empresas.limite_faturamento_anual IS
    'Limite anual de faturamento. MEI=81000, ME=360000, EPP=4800000';

COMMENT ON COLUMN empresas.mei_categoria IS
    'Categoria MEI (só aplicável se regime=MEI): COMERCIO_INDUSTRIA, SERVICOS, AMBOS';

COMMENT ON COLUMN empresas.mei_valor_das_mensal IS
    'Override manual do valor mensal do DAS MEI (null usa valor padrão da categoria)';