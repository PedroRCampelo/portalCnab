-- V40: Adiciona coluna 'codigo' à tabela recebimentos.
-- O campo existe na entity Recebimento (ex: "RC-00001") e é gerado no RecebimentoService,
-- mas nunca foi criado por uma migration.

ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS codigo VARCHAR(20);

-- Preenche codigo para registros existentes usando o numero existente
UPDATE recebimentos
SET    codigo = REPLACE(numero, 'RC', 'RC-')
WHERE  codigo IS NULL AND numero IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receb_empresa_codigo
    ON recebimentos(empresa_id, codigo)
    WHERE codigo IS NOT NULL;