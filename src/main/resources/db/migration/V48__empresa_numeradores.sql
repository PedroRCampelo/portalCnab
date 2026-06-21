-- Tabela de numeradores por empresa (substitui sequences globais)
-- Cada empresa tem seu próprio contador por tipo de documento
CREATE TABLE IF NOT EXISTS empresa_numeradores (
    empresa_id UUID        NOT NULL REFERENCES empresas(id),
    tipo       VARCHAR(20) NOT NULL,
    ultimo     BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (empresa_id, tipo)
);

-- Inicializa contadores para orçamentos existentes
INSERT INTO empresa_numeradores (empresa_id, tipo, ultimo)
SELECT
    o.empresa_id,
    'ORC',
    COALESCE(MAX(CAST(SUBSTRING(o.numero FROM 5) AS BIGINT)), 0)
FROM orcamentos o
WHERE o.numero ~ '^ORC-[0-9]+$'
GROUP BY o.empresa_id
ON CONFLICT (empresa_id, tipo) DO UPDATE
    SET ultimo = GREATEST(empresa_numeradores.ultimo, EXCLUDED.ultimo);

-- Inicializa contadores para pedidos de venda existentes
INSERT INTO empresa_numeradores (empresa_id, tipo, ultimo)
SELECT
    p.empresa_id,
    'PV',
    COALESCE(MAX(CAST(SUBSTRING(p.numero FROM 4) AS BIGINT)), 0)
FROM pedidos_venda p
WHERE p.numero ~ '^PV-[0-9]+$'
GROUP BY p.empresa_id
ON CONFLICT (empresa_id, tipo) DO UPDATE
    SET ultimo = GREATEST(empresa_numeradores.ultimo, EXCLUDED.ultimo);

-- Inicializa contadores para recebimentos existentes
INSERT INTO empresa_numeradores (empresa_id, tipo, ultimo)
SELECT
    r.empresa_id,
    'RC',
    COALESCE(MAX(CAST(SUBSTRING(r.codigo FROM 4) AS BIGINT)), 0)
FROM recebimentos r
WHERE r.codigo ~ '^RC-[0-9]+$'
GROUP BY r.empresa_id
ON CONFLICT (empresa_id, tipo) DO UPDATE
    SET ultimo = GREATEST(empresa_numeradores.ultimo, EXCLUDED.ultimo);
