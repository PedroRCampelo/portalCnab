ALTER TABLE orcamentos
    ADD COLUMN IF NOT EXISTS data_emissao DATE;

UPDATE orcamentos SET data_emissao = CAST(criado_em AS DATE) WHERE data_emissao IS NULL;
