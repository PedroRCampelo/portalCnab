-- V4: Historico de remessas geradas
-- Registra cada geracao de Excel ou PDF para controle de uso e auditoria

CREATE TABLE remessas (
                          id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
                          usuario_id      UUID          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                          empresa_id      UUID          NOT NULL REFERENCES empresas(id),

    -- Identificacao do arquivo
                          nome_arquivo    VARCHAR(255)  NOT NULL,
                          banco           VARCHAR(50)   NOT NULL,   -- ex: ITAU, BRADESCO
                          versao          VARCHAR(10)   NOT NULL,   -- ex: 240, 400
                          modo            VARCHAR(20)   NOT NULL,   -- ex: PAGAMENTO, COBRANCA

    -- Tipo de saida gerada
                          tipo_saida      VARCHAR(10)   NOT NULL,   -- EXCEL | PDF

    -- Dados extraidos do arquivo (melhor esforco — podem ser nulos)
                          qtd_registros   INTEGER,
                          valor_total     NUMERIC(18,2),

    -- Auditoria
                          gerado_em       TIMESTAMP     NOT NULL DEFAULT NOW(),
                          ip_origem       VARCHAR(45)   -- IPv4 ou IPv6
);

-- Indice para busca por usuario (listagem do historico)
CREATE INDEX idx_remessas_usuario ON remessas(usuario_id, gerado_em DESC);

-- Indice para contagem mensal (controle de cota)
CREATE INDEX idx_remessas_usuario_mes ON remessas(usuario_id, gerado_em);