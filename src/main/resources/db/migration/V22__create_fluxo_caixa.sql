-- V22: Módulo Fluxo de Caixa — tabelas de saldo bancário e movimentos.
--
-- Arquitetura:
--   saldos_bancarios:    cadastro das contas + saldo_inicial (imutável)
--   movimentos_bancarios: razão auxiliar — cada linha é um evento financeiro
--
-- Saldo "atual" da conta = saldo_inicial + soma(movimentos não cancelados)
-- (calculado on-demand, não persistido)

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABELA 1: Contas bancárias
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE saldos_bancarios (
                                  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

                                  empresa_id      UUID            NOT NULL REFERENCES empresas(id),
                                  usuario_id      UUID            NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

                                  nome_conta      VARCHAR(100)    NOT NULL,
                                  banco           VARCHAR(50),

    -- IMPORTANTE: saldo_inicial é IMUTÁVEL (definido na criação da conta).
    -- Ajustes futuros são feitos via movimentos do tipo AJUSTE_MANUAL.
                                  saldo_inicial   NUMERIC(18,2)   NOT NULL DEFAULT 0,

    -- Data em que o saldo inicial foi registrado
                                  data_inicial    DATE            NOT NULL DEFAULT CURRENT_DATE,

                                  principal       BOOLEAN         NOT NULL DEFAULT FALSE,
                                  ativo           BOOLEAN         NOT NULL DEFAULT TRUE,

                                  criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                  atualizado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saldos_empresa_ativo ON saldos_bancarios(empresa_id, ativo);

-- Garante 1 conta principal por empresa
CREATE UNIQUE INDEX idx_saldos_empresa_principal
    ON saldos_bancarios(empresa_id)
    WHERE principal = TRUE AND ativo = TRUE;


-- ─────────────────────────────────────────────────────────────────────────────
-- TABELA 2: Movimentos bancários (razão auxiliar)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE movimentos_bancarios (
                                      id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

                                      empresa_id      UUID            NOT NULL REFERENCES empresas(id),
                                      usuario_id      UUID            NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Conta bancária do movimento
                                      conta_id        UUID            NOT NULL REFERENCES saldos_bancarios(id),

    -- Quando o movimento aconteceu (relevância contábil)
                                      data_movimento  DATE            NOT NULL,

    -- Tipo do evento — define semântica e tratamento na UI
                                      tipo            VARCHAR(30)     NOT NULL,
    -- Valores: SALDO_INICIAL | RECEBIMENTO | PAGAMENTO | AJUSTE_MANUAL
    --        | ESTORNO_RECEBIMENTO | ESTORNO_PAGAMENTO

    -- Direção do movimento (pra evitar derivar do tipo em todo lugar)
                                      eh_entrada      BOOLEAN         NOT NULL,
    -- TRUE  = soma no saldo (recebimento, ajuste positivo, saldo inicial > 0)
    -- FALSE = subtrai do saldo (pagamento, ajuste negativo)

    -- Valor SEMPRE POSITIVO. O sinal vem de eh_entrada.
                                      valor           NUMERIC(18,2)   NOT NULL CHECK (valor > 0),

                                      descricao       VARCHAR(255)    NOT NULL,

    -- Origem do movimento (referência ao documento que gerou)
                                      origem_tipo     VARCHAR(30),
    -- Valores: RECEBIMENTO | TITULO | NULL (saldo inicial / ajuste manual)
                                      origem_id       UUID,
    -- ID do recebimento/título (sem FK — pode ser deletado sem afetar histórico)

    -- Pra estornos: aponta pro movimento que está sendo anulado
                                      movimento_estornado_id  UUID    REFERENCES movimentos_bancarios(id),

    -- Soft delete (NUNCA apagar movimento — sempre cancelar e criar compensação)
                                      cancelado       BOOLEAN         NOT NULL DEFAULT FALSE,
                                      motivo_cancelamento VARCHAR(255),

                                      criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Constraints de integridade
ALTER TABLE movimentos_bancarios
    ADD CONSTRAINT chk_mov_tipo CHECK (
        tipo IN (
                 'SALDO_INICIAL', 'RECEBIMENTO', 'PAGAMENTO',
                 'AJUSTE_MANUAL', 'ESTORNO_RECEBIMENTO', 'ESTORNO_PAGAMENTO'
            )
        ),
    ADD CONSTRAINT chk_mov_origem_tipo CHECK (
        origem_tipo IS NULL OR origem_tipo IN ('RECEBIMENTO', 'TITULO')
    ),
    -- Estornos DEVEM apontar pro movimento estornado
    ADD CONSTRAINT chk_mov_estorno CHECK (
        (tipo IN ('ESTORNO_RECEBIMENTO', 'ESTORNO_PAGAMENTO') AND movimento_estornado_id IS NOT NULL)
        OR
        (tipo NOT IN ('ESTORNO_RECEBIMENTO', 'ESTORNO_PAGAMENTO'))
    );

-- Índices para performance
CREATE INDEX idx_mov_conta_data    ON movimentos_bancarios(conta_id, data_movimento DESC);
CREATE INDEX idx_mov_empresa_data  ON movimentos_bancarios(empresa_id, data_movimento DESC);
CREATE INDEX idx_mov_origem        ON movimentos_bancarios(origem_tipo, origem_id) WHERE origem_id IS NOT NULL;
CREATE INDEX idx_mov_estornado     ON movimentos_bancarios(movimento_estornado_id) WHERE movimento_estornado_id IS NOT NULL;

COMMIT;