-- V35: Sprint WA-1 — WhatsApp Bot (sessões e mensagens)
--
-- whatsapp_sessoes: sessão ativa por usuário (contexto da conversa)
-- whatsapp_mensagens: histórico de todas as mensagens trocadas

CREATE TABLE IF NOT EXISTS whatsapp_sessoes (
                                                id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID            NOT NULL REFERENCES usuarios(id),
    empresa_id      UUID            NOT NULL REFERENCES empresas(id),
    telefone        VARCHAR(20)     NOT NULL,
    contexto        TEXT,
    ultima_mensagem_em TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ativa           BOOLEAN         NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_wa_sessao_telefone ON whatsapp_sessoes(telefone, ativa);
CREATE INDEX IF NOT EXISTS idx_wa_sessao_usuario ON whatsapp_sessoes(usuario_id, ativa);

CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
                                                  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id       UUID            NOT NULL REFERENCES whatsapp_sessoes(id),
    direcao         VARCHAR(10)     NOT NULL,
    tipo            VARCHAR(10)     NOT NULL DEFAULT 'TEXTO',
    conteudo        TEXT,
    transcricao     TEXT,
    acao_executada   VARCHAR(50),
    acao_id         UUID,
    criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_wa_msg_direcao CHECK (direcao IN ('ENTRADA', 'SAIDA')),
    CONSTRAINT chk_wa_msg_tipo CHECK (tipo IN ('TEXTO', 'AUDIO', 'IMAGEM', 'SISTEMA'))
    );

CREATE INDEX IF NOT EXISTS idx_wa_msg_sessao ON whatsapp_mensagens(sessao_id, criado_em);