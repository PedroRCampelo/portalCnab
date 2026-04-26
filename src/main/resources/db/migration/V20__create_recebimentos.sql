-- V20: módulo Recebimentos — tabela recebimentos
--
-- Tabela separada de `titulos` (decisão arquitetural):
--   - Schema limpo, sem campos órfãos de contas a pagar
--   - Permite features específicas (cobrança WhatsApp, parciais, recorrência)
--   - Fluxo de caixa une as duas via UNION (query simples)
--
-- Recebimento parcial: valor (total contratado) vs valor_recebido (acumulado)
-- Status calculado: PENDENTE | RECEBIDO | PARCIAL | ATRASADO | CANCELADO

BEGIN;

CREATE TABLE recebimentos (
                              id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Multi-tenant + auditoria de quem criou
                              empresa_id          UUID            NOT NULL REFERENCES empresas(id),
                              usuario_id          UUID            NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Cliente (FK obrigatório — recebimento sempre tem cliente)
                              cliente_id          UUID            NOT NULL REFERENCES clientes(id),

    -- Identificação do recebimento
                              descricao           VARCHAR(255)    NOT NULL,            -- ex: "Consultoria mês de abril"
                              categoria           VARCHAR(50),                          -- livre, ex: "serviço", "produto"

    -- Datas
                              data_emissao        DATE            NOT NULL DEFAULT CURRENT_DATE,
                              data_vencimento     DATE            NOT NULL,             -- "vai receber em..."
                              data_recebimento    DATE,                                 -- "recebeu em..." (preenchida quando dá baixa)

    -- Valores
                              valor               NUMERIC(18,2)   NOT NULL CHECK (valor > 0),     -- contratado
                              valor_recebido      NUMERIC(18,2)   NOT NULL DEFAULT 0 CHECK (valor_recebido >= 0),

    -- Forma de pagamento esperada
                              forma_pagamento     VARCHAR(20)     NOT NULL DEFAULT 'PIX',
    -- Valores: PIX | BOLETO | DINHEIRO | CARTAO_CREDITO | CARTAO_DEBITO | TRANSFERENCIA | OUTROS

    -- Parcelamento (versão simples — número da parcela / total)
                              parcela_atual       INTEGER         NOT NULL DEFAULT 1,
                              parcela_total       INTEGER         NOT NULL DEFAULT 1,

    -- Recorrência (V1: marcação só; geração automática fica pra V2)
                              recorrente          BOOLEAN         NOT NULL DEFAULT FALSE,
                              recorrencia_tipo    VARCHAR(10),    -- MENSAL | SEMANAL | QUINZENAL | ANUAL

    -- Status
                              status              VARCHAR(15)     NOT NULL DEFAULT 'PENDENTE',
    -- Valores: PENDENTE | RECEBIDO | PARCIAL | ATRASADO | CANCELADO

    -- Observações
                              observacao          TEXT,

    -- Auditoria
                              criado_em           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              atualizado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Constraints
ALTER TABLE recebimentos
    ADD CONSTRAINT chk_receb_status CHECK (
        status IN ('PENDENTE', 'RECEBIDO', 'PARCIAL', 'ATRASADO', 'CANCELADO')
        ),
    ADD CONSTRAINT chk_receb_forma CHECK (
        forma_pagamento IN ('PIX', 'BOLETO', 'DINHEIRO', 'CARTAO_CREDITO',
                            'CARTAO_DEBITO', 'TRANSFERENCIA', 'OUTROS')
    ),
    ADD CONSTRAINT chk_receb_recorrencia CHECK (
        recorrente = FALSE OR recorrencia_tipo IN ('MENSAL', 'SEMANAL', 'QUINZENAL', 'ANUAL')
    ),
    ADD CONSTRAINT chk_receb_valor_recebido CHECK (
        valor_recebido <= valor
    ),
    ADD CONSTRAINT chk_receb_parcela CHECK (
        parcela_atual >= 1 AND parcela_atual <= parcela_total
    );

-- Índices pra performance (queries mais comuns)
CREATE INDEX idx_receb_empresa_status   ON recebimentos(empresa_id, status);
CREATE INDEX idx_receb_empresa_venc     ON recebimentos(empresa_id, data_vencimento);
CREATE INDEX idx_receb_cliente          ON recebimentos(cliente_id);

-- ── Tabela de auditoria de cobranças (rastreamento WhatsApp) ──────────────
--
-- Toda vez que o MEI envia uma cobrança (clica no botão WhatsApp),
-- registramos aqui. Usado para:
--   - Mostrar histórico de cobranças por recebimento
--   - Calcular score de cliente (atrasou, foi cobrado quantas vezes)
--   - Evitar spam (não sugerir cobrar de novo nas próximas 24h)

CREATE TABLE cobrancas_enviadas (
                                    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),

                                    recebimento_id  UUID            NOT NULL REFERENCES recebimentos(id) ON DELETE CASCADE,
                                    empresa_id      UUID            NOT NULL REFERENCES empresas(id),
                                    usuario_id      UUID            NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Tipo da mensagem enviada (define o tom da cobrança)
                                    tipo_mensagem   VARCHAR(20)     NOT NULL,
    -- Valores: LEMBRETE | COBRANCA_AMIGAVEL | COBRANCA_FORMAL | COBRANCA_FIRME

    -- Canal usado
                                    canal           VARCHAR(20)     NOT NULL DEFAULT 'WHATSAPP',
    -- Valores: WHATSAPP | EMAIL | SMS (futuro)

    -- Texto efetivo enviado (snapshot — útil pra auditoria/histórico)
                                    mensagem_texto  TEXT,

                                    enviado_em      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cobrancas_enviadas
    ADD CONSTRAINT chk_cobr_tipo CHECK (
        tipo_mensagem IN ('LEMBRETE', 'COBRANCA_AMIGAVEL', 'COBRANCA_FORMAL', 'COBRANCA_FIRME')
        ),
    ADD CONSTRAINT chk_cobr_canal CHECK (
        canal IN ('WHATSAPP', 'EMAIL', 'SMS')
    );

CREATE INDEX idx_cobr_recebimento ON cobrancas_enviadas(recebimento_id, enviado_em DESC);

COMMIT;