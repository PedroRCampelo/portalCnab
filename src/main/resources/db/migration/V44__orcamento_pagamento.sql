-- V44: Adiciona condições de pagamento ao orçamento

ALTER TABLE orcamentos
    ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'A_DEFINIR',
    ADD COLUMN IF NOT EXISTS num_parcelas    INTEGER     NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS intervalo_dias  INTEGER     NOT NULL DEFAULT 30;
