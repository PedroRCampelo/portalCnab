-- V16: Cache de insight separado por bot (aurora, frank, anne)
-- Cada bot tem seu próprio texto e data de geração independentes

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS insight_aurora_texto     TEXT,
    ADD COLUMN IF NOT EXISTS insight_aurora_gerado_em DATE,
    ADD COLUMN IF NOT EXISTS insight_frank_texto      TEXT,
    ADD COLUMN IF NOT EXISTS insight_frank_gerado_em  DATE,
    ADD COLUMN IF NOT EXISTS insight_anne_texto       TEXT,
    ADD COLUMN IF NOT EXISTS insight_anne_gerado_em   DATE;