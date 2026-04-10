-- V12: campos CNAB para geração de remessa diretamente dos títulos
-- Divididos em grupos: dados bancários do favorecido, PIX e endereço

-- ── Dados bancários do favorecido (Seg A — TED/DOC/Crédito em conta) ────────
ALTER TABLE titulos
    ADD COLUMN IF NOT EXISTS favorecido_banco_code   VARCHAR(3),    -- ex: '341'
    ADD COLUMN IF NOT EXISTS favorecido_agencia      VARCHAR(5),
    ADD COLUMN IF NOT EXISTS favorecido_agencia_dv   VARCHAR(1),
    ADD COLUMN IF NOT EXISTS favorecido_conta         VARCHAR(12),
    ADD COLUMN IF NOT EXISTS favorecido_conta_dv      VARCHAR(1),
    ADD COLUMN IF NOT EXISTS favorecido_tipo_conta    VARCHAR(2),   -- CC | CP | PP
    ADD COLUMN IF NOT EXISTS favorecido_tipo_inscricao VARCHAR(1),  -- 1=CPF 2=CNPJ
    ADD COLUMN IF NOT EXISTS finalidade_ted           VARCHAR(5),   -- código da finalidade
    ADD COLUMN IF NOT EXISTS finalidade_doc           VARCHAR(2),
    ADD COLUMN IF NOT EXISTS aviso                    VARCHAR(1) DEFAULT '0'; -- 0=não 2=sim

-- ── PIX (Seg A modo PIX / Caixa) ─────────────────────────────────────────────
ALTER TABLE titulos
    ADD COLUMN IF NOT EXISTS tipo_chave_pix  VARCHAR(10),  -- CPF | CNPJ | EMAIL | TELEFONE | EVP
    ADD COLUMN IF NOT EXISTS chave_pix       VARCHAR(99);

-- ── Endereço do favorecido (exigido por alguns bancos no Seg B) ───────────────
ALTER TABLE titulos
    ADD COLUMN IF NOT EXISTS favorecido_logradouro VARCHAR(40),
    ADD COLUMN IF NOT EXISTS favorecido_cidade     VARCHAR(15),
    ADD COLUMN IF NOT EXISTS favorecido_estado     VARCHAR(2),
    ADD COLUMN IF NOT EXISTS favorecido_cep        VARCHAR(8);

-- ── Controle CNAB ─────────────────────────────────────────────────────────────
ALTER TABLE titulos
    ADD COLUMN IF NOT EXISTS seu_numero      VARCHAR(20),  -- referência do pagador
    ADD COLUMN IF NOT EXISTS nosso_numero    VARCHAR(20);  -- retorno do banco