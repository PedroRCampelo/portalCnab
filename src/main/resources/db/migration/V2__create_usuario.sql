-- ─────────────────────────────────────────────────────────────────────────────
-- Migration V2: Criação da tabela usuarios
--
-- Por que armazenar apenas senha_hash?
--   A senha nunca é guardada em texto puro. O BCrypt gera um hash irreversível.
--   Mesmo que o banco seja comprometido, as senhas não são recuperáveis.
--
-- Por que ENUM para perfil?
--   Garante integridade: só valores válidos entram no banco.
--   Mais eficiente que VARCHAR para comparações.
--
-- Perfis:
--   ADMIN      → gerencia usuários, acessa tudo
--   OPERADOR   → gera remessas, baixa Excel/PDF
--   VISUALIZADOR → apenas consulta histórico e relatórios
-- ─────────────────────────────────────────────────────────────────────────────

-- Tipo ENUM para perfis de acesso
CREATE TYPE perfil_usuario AS ENUM ('ADMIN', 'OPERADOR', 'VISUALIZADOR');

CREATE TABLE usuarios (
                          id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
                          empresa_id      UUID            NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
                          nome            VARCHAR(100)    NOT NULL,
                          email           VARCHAR(150)    NOT NULL UNIQUE,
                          senha_hash      VARCHAR(255)    NOT NULL,   -- BCrypt: sempre 60 chars, mas 255 é boa prática
                          perfil          perfil_usuario  NOT NULL DEFAULT 'OPERADOR',
                          ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
                          criado_em       TIMESTAMP       NOT NULL DEFAULT NOW(),
                          atualizado_em   TIMESTAMP       NOT NULL DEFAULT NOW(),
                          ultimo_acesso   TIMESTAMP       NULL        -- NULL = nunca acessou
);

-- Índice no email: login usa email como identificador
CREATE INDEX idx_usuarios_email      ON usuarios(email);

-- Índice composto: buscar usuários ativos de uma empresa específica
CREATE INDEX idx_usuarios_empresa_ativo ON usuarios(empresa_id, ativo);

COMMENT ON TABLE  usuarios                 IS 'Usuários do sistema portalCnab';
COMMENT ON COLUMN usuarios.empresa_id      IS 'Empresa à qual o usuário pertence';
COMMENT ON COLUMN usuarios.senha_hash      IS 'Hash BCrypt da senha — NUNCA armazenar senha em texto puro';
COMMENT ON COLUMN usuarios.perfil          IS 'ADMIN | OPERADOR | VISUALIZADOR';
COMMENT ON COLUMN usuarios.ativo           IS 'false = usuário desativado, não consegue logar';
COMMENT ON COLUMN usuarios.ultimo_acesso   IS 'Atualizado a cada login bem-sucedido — útil para auditoria';

-- ─────────────────────────────────────────────────────────────────────────────
-- Dados iniciais: empresa e usuário admin para primeiro acesso
--
-- IMPORTANTE: Troque a senha no primeiro login!
-- Hash abaixo corresponde à senha: Admin@Portal2026
-- Gere um novo em produção com: BCrypt.hashpw("suaSenha", BCrypt.gensalt(12))
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO empresas (id, nome, cnpj)
VALUES (
           '00000000-0000-0000-0000-000000000001',
           'Empresa Padrão',
           '00.000.000/0001-00'
       );

INSERT INTO usuarios (empresa_id, nome, email, senha_hash, perfil)
VALUES (
           '00000000-0000-0000-0000-000000000001',
           'Administrador',
           'admin@portalcnab.local',
           -- Senha: Admin@Portal2026  (BCrypt com strength 12)
           '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpR1tZGLfBdHHe',
           'ADMIN'
       );