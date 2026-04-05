-- ─────────────────────────────────────────────────────────────────────────────
-- Migration V7: Módulo de Títulos (Contas a Pagar)
--
-- Compatível com campos Protheus SE2/E2 para integração futura via API.
-- Preparado para geração de remessa CNAB.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE titulos (
                         id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Vínculo com o usuário/empresa
                         usuario_id          UUID            NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                         empresa_id          UUID            NOT NULL REFERENCES empresas(id),

    -- Identificação (equivalente E2_PREFIXO, E2_NUM, E2_PARCELA)
                         prefixo             VARCHAR(10)     NOT NULL DEFAULT 'AP',
                         numero              VARCHAR(20)     NOT NULL,
                         parcela             VARCHAR(3)      NOT NULL DEFAULT '001',

    -- Tipo de pagamento (equivalente E2_TIPO)
                         tipo                VARCHAR(10)     NOT NULL DEFAULT 'BOLETO',
    -- Valores: PIX, BOLETO, TED

    -- Fornecedor simplificado (E2_FORNECE + E2_LOJA unificados)
                         fornecedor_nome     VARCHAR(150)    NOT NULL,
                         fornecedor_documento VARCHAR(20)   NOT NULL,

    -- Datas (equivalente E2_EMISSAO, E2_VENCREA)
                         emissao             DATE            NOT NULL DEFAULT CURRENT_DATE,
                         vencimento          DATE            NOT NULL,

    -- Valores (equivalente E2_VALOR, E2_SALDO, E2_DESCONT, E2_JUROS, E2_MULTA)
                         valor               NUMERIC(18,2)   NOT NULL,
                         saldo               NUMERIC(18,2)   NOT NULL,
                         desconto            NUMERIC(18,2)   NOT NULL DEFAULT 0,
                         juros               NUMERIC(18,2)   NOT NULL DEFAULT 0,
                         multa               NUMERIC(18,2)   NOT NULL DEFAULT 0,

    -- Observação (equivalente E2_HIST)
                         observacao          VARCHAR(500)    NULL,

    -- Status
                         status              VARCHAR(10)     NOT NULL DEFAULT 'PENDENTE',
    -- Valores: PENDENTE, PAGO, VENCIDO

    -- Integração futura Protheus/CNAB
                         numero_bordero      VARCHAR(20)     NULL,    -- E2_NUMBOR
                         id_cnab             VARCHAR(50)     NULL,    -- E2_IDCNAB
                         codigo_barras       VARCHAR(50)     NULL,    -- E2_CODBAR
                         linha_digitavel     VARCHAR(100)    NULL,    -- E2_LINDIG

    -- Auditoria
                         criado_em           TIMESTAMP       NOT NULL DEFAULT NOW(),
                         atualizado_em       TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Índices para consultas comuns
CREATE INDEX idx_titulos_usuario        ON titulos(usuario_id);
CREATE INDEX idx_titulos_vencimento     ON titulos(vencimento);
CREATE INDEX idx_titulos_status         ON titulos(status);
CREATE INDEX idx_titulos_numero         ON titulos(usuario_id, numero, parcela);
CREATE INDEX idx_titulos_fornecedor     ON titulos(usuario_id, fornecedor_documento);

COMMENT ON TABLE titulos IS 'Módulo de títulos a pagar — compatível com Protheus SE2/E2';
COMMENT ON COLUMN titulos.prefixo             IS 'E2_PREFIXO';
COMMENT ON COLUMN titulos.numero              IS 'E2_NUM';
COMMENT ON COLUMN titulos.parcela             IS 'E2_PARCELA';
COMMENT ON COLUMN titulos.tipo                IS 'E2_TIPO: PIX | BOLETO | TED';
COMMENT ON COLUMN titulos.fornecedor_documento IS 'CNPJ/CPF — E2_FORNECE+E2_LOJA unificados';
COMMENT ON COLUMN titulos.emissao             IS 'E2_EMISSAO';
COMMENT ON COLUMN titulos.vencimento          IS 'E2_VENCREA';
COMMENT ON COLUMN titulos.saldo               IS 'E2_SALDO — valor menos pagamentos parciais';
COMMENT ON COLUMN titulos.numero_bordero      IS 'E2_NUMBOR — borderô de pagamento';
COMMENT ON COLUMN titulos.id_cnab             IS 'E2_IDCNAB — identificador na remessa CNAB';
COMMENT ON COLUMN titulos.codigo_barras       IS 'E2_CODBAR';
COMMENT ON COLUMN titulos.linha_digitavel     IS 'E2_LINDIG';