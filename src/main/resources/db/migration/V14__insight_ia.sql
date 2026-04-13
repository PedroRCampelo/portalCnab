-- V14: Campo para cache de insights financeiros gerados por IA

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS insight_texto      TEXT,
    ADD COLUMN IF NOT EXISTS insight_gerado_em  DATE,
    ADD COLUMN IF NOT EXISTS insight_versao     INTEGER DEFAULT 0;