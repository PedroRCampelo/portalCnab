-- V31: Sprint F1.1 — Auditoria, rastreio e padronização de chaves
--
-- 1. Campos de auditoria (quem criou/alterou/baixou/cancelou) em recebimentos, titulos, movimentos
-- 2. Padronização Protheus: numero sequencial + parcela + chave composta
--    - Recebimentos: RC00001, RC00002...
--    - Títulos: AP00001, AP00002...
--    - Chave = numero || parcela → "RC0000101", "AP0000103"
-- 3. Campos parcela_atual / parcela_total (INT) nos títulos
--
-- NOTA: sem BEGIN/COMMIT — Flyway gerencia a transação automaticamente.

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEQUÊNCIAS para numeração automática
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS seq_recebimento_numero START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_titulo_numero START WITH 1 INCREMENT BY 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RECEBIMENTOS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Chave composta: numero || parcela (ex: "RC0000101")
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS chave VARCHAR(20);

-- Parcela como string padronizada "01", "02"
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS parcela VARCHAR(3);

-- Audit trail
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS criado_por_id    UUID REFERENCES usuarios(id);
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS alterado_por_id  UUID REFERENCES usuarios(id);
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS baixado_por_id   UUID REFERENCES usuarios(id);
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS baixado_em       TIMESTAMP;
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS cancelado_por_id UUID REFERENCES usuarios(id);
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS cancelado_em     TIMESTAMP;

-- Preenche auditoria dos existentes
UPDATE recebimentos SET criado_por_id = usuario_id WHERE criado_por_id IS NULL;

-- Preenche parcela string a partir do parcela_atual existente
UPDATE recebimentos SET parcela = LPAD(parcela_atual::TEXT, 2, '0') WHERE parcela IS NULL;

-- Gera numero sequencial (RC00001) para registros existentes e monta chave
DO $$
DECLARE
r RECORD;
    seq INT := 0;
    ultimo_numero TEXT := '';
    numero_atual TEXT;
BEGIN
FOR r IN SELECT id, numero, parcela_atual FROM recebimentos ORDER BY criado_em ASC
    LOOP
        IF r.numero IS DISTINCT FROM ultimo_numero THEN
             seq := seq + 1;
numero_atual := 'RC' || LPAD(seq::TEXT, 5, '0');
            ultimo_numero := r.numero;
END IF;

UPDATE recebimentos
SET numero = numero_atual,
    chave = numero_atual || LPAD(r.parcela_atual::TEXT, 2, '0')
WHERE id = r.id;
END LOOP;

    IF seq > 0 THEN
        PERFORM setval('seq_recebimento_numero', seq);
END IF;
END $$;

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_receb_empresa_chave ON recebimentos(empresa_id, chave) WHERE chave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receb_empresa_numero ON recebimentos(empresa_id, numero);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TÍTULOS (contas a pagar)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Chave composta: numero || parcela (ex: "AP0000101")
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS chave VARCHAR(20);

-- Parcela como int (padronização)
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS parcela_atual INT;
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS parcela_total INT;

-- Audit trail
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS criado_por_id    UUID REFERENCES usuarios(id);
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS alterado_por_id  UUID REFERENCES usuarios(id);
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS baixado_por_id   UUID REFERENCES usuarios(id);
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS baixado_em       TIMESTAMP;
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS cancelado_por_id UUID REFERENCES usuarios(id);
ALTER TABLE titulos ADD COLUMN IF NOT EXISTS cancelado_em     TIMESTAMP;

-- Preenche auditoria dos existentes
UPDATE titulos SET criado_por_id = usuario_id WHERE criado_por_id IS NULL;

-- Preenche parcela_atual/parcela_total a partir da parcela string existente
UPDATE titulos SET
    parcela_atual = CASE WHEN parcela ~ '^\d+$' THEN parcela::INT ELSE 1 END,
    parcela_total = CASE WHEN parcela ~ '^\d+$' THEN parcela::INT ELSE 1 END
WHERE parcela_atual IS NULL;

-- Calcula parcela_total real: agrupa pelo numero e conta quantas parcelas existem
UPDATE titulos t SET parcela_total = sub.total
    FROM (
    SELECT numero, usuario_id, COUNT(*) AS total
    FROM titulos
    GROUP BY numero, usuario_id
) sub
WHERE t.numero = sub.numero AND t.usuario_id = sub.usuario_id;

-- Gera numero sequencial (AP00001) para registros existentes e monta chave
DO $$
DECLARE
r RECORD;
    seq INT := 0;
    ultimo_numero TEXT := '';
    ultimo_usuario UUID;
    numero_atual TEXT;
BEGIN
FOR r IN SELECT id, numero, parcela, usuario_id FROM titulos ORDER BY criado_em ASC
    LOOP
        IF r.numero IS DISTINCT FROM ultimo_numero OR r.usuario_id IS DISTINCT FROM ultimo_usuario THEN
             seq := seq + 1;
numero_atual := 'AP' || LPAD(seq::TEXT, 5, '0');
            ultimo_numero := r.numero;
            ultimo_usuario := r.usuario_id;
END IF;

UPDATE titulos
SET numero = numero_atual,
    chave = numero_atual || LPAD(
            CASE WHEN r.parcela ~ '^\d+$' THEN r.parcela::INT ELSE 1 END::TEXT,
            2, '0')
WHERE id = r.id;
END LOOP;

    IF seq > 0 THEN
        PERFORM setval('seq_titulo_numero', seq);
END IF;
END $$;

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_titulo_empresa_chave ON titulos(empresa_id, chave) WHERE chave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_titulo_empresa_numero ON titulos(empresa_id, numero);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MOVIMENTOS BANCÁRIOS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE movimentos_bancarios ADD COLUMN IF NOT EXISTS criado_por_id    UUID REFERENCES usuarios(id);
ALTER TABLE movimentos_bancarios ADD COLUMN IF NOT EXISTS cancelado_por_id UUID REFERENCES usuarios(id);
ALTER TABLE movimentos_bancarios ADD COLUMN IF NOT EXISTS cancelado_em     TIMESTAMP;

UPDATE movimentos_bancarios SET criado_por_id = usuario_id WHERE criado_por_id IS NULL;