-- V41: Torna fornecedor_documento nullable em titulos.
-- Despesas lançadas pelo WhatsApp Bot não têm CPF/CNPJ do fornecedor.

ALTER TABLE titulos ALTER COLUMN fornecedor_documento DROP NOT NULL;