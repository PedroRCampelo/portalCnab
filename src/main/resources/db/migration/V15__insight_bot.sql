-- V15: Campo para identificar qual bot gerou o insight em cache

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS insight_bot VARCHAR(10) DEFAULT 'aurora';