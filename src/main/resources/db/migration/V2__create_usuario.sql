-- ─────────────────────────────────────────────────────────────────────────────
-- Migration V2: Criação da tabela usuarios
--
-- Por que armazenar apenas senha_hash?
--   A senha nunca é guardada em texto puro. O BCrypt gera um hash irreversível.
--   Mesmo que o banco seja comprometido, as senhas não são recuperáveis.
--
-- Por que VARCHAR para perfil em vez de ENUM?
--   VARCHAR é mais flexível — não exige alteração de tipo no banco ao adicionar perfis.
--   A integridade é garantida pela aplicação (enum Java PerfilUsuario).
--
-- Perfis:
--   ADMIN        → gerencia usuários, acessa tudo
--   OPERADOR     → gera remessas, baixa Excel/PDF
--   VISUALIZADOR → apenas consulta histórico e relatórios
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE usuarios (
                          id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                          empresa_id          UUID            NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
                          nome                VARCHAR(100)    NOT NULL,
                          email               VARCHAR(150)    NOT NULL UNIQUE,
                          senha_hash          VARCHAR(255)    NOT NULL,
                          perfil              VARCHAR(20)     NOT NULL DEFAULT 'OPERADOR',
                          ativo               BOOLEAN         NOT NULL DEFAULT TRUE,
                          criado_em           TIMESTAMP       NOT NULL DEFAULT NOW(),
                          atualizado_em       TIMESTAMP       NOT NULL DEFAULT NOW(),
                          ultimo_acesso       TIMESTAMP       NULL,
                          plano_id            UUID            NULL,
                          email_verificado    BOOLEAN         NOT NULL DEFAULT FALSE,
                          token_verificacao   VARCHAR(255)    NULL,
                          token_expiracao     TIMESTAMP       NULL,
                          usos_mes_atual      INTEGER         NOT NULL DEFAULT 0,
                          mes_referencia      VARCHAR(7)      NULL
);

CREATE INDEX idx_usuarios_email         ON usuarios(email);
CREATE INDEX idx_usuarios_empresa_ativo ON usuarios(empresa_id, ativo);

COMMENT ON TABLE  usuarios              IS 'Usuários do sistema Whallet';
COMMENT ON COLUMN usuarios.senha_hash   IS 'Hash BCrypt — NUNCA armazenar senha em texto puro';
COMMENT ON COLUMN usuarios.perfil       IS 'ADMIN | OPERADOR | VISUALIZADOR';
COMMENT ON COLUMN usuarios.ativo        IS 'false = usuário desativado, não consegue logar';
COMMENT ON COLUMN usuarios.ultimo_acesso IS 'Atualizado a cada login bem-sucedido';

-- NOTA: dados iniciais devem ser inseridos manualmente via script seguro
-- nunca incluir credenciais em migrations versionadas no git