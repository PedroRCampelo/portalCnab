-- V34: Fix unique index de documento em clientes
--
-- O índice anterior impedia cadastrar um novo cliente com o mesmo CPF/CNPJ
-- de um cliente inativo (soft-deleted). Agora só considera clientes ativos.

DROP INDEX IF EXISTS idx_clientes_documento_empresa;

CREATE UNIQUE INDEX idx_clientes_documento_empresa
    ON clientes(empresa_id, documento)
    WHERE documento IS NOT NULL AND ativo = true;