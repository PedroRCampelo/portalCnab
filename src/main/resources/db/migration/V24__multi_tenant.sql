-- ═════════════════════════════════════════════════════════════════════════════
-- V24 — Multi-tenant real (Sprint 2.2-A1)
--
-- Mudanças:
--   1. CNPJ vira opcional (nullable) na tabela empresas
--   2. Adiciona campo papel_empresa em usuarios (DONO / MEMBRO)
--   3. NÃO apaga dados existentes — quem rodar localmente pode usar drop-local.sql
-- ═════════════════════════════════════════════════════════════════════════════


-- ── Empresas: CNPJ opcional ─────────────────────────────────────────────────

-- CNPJ vira nullable (MEI pode usar app sem CNPJ no plano gratuito)
ALTER TABLE empresas
    ALTER COLUMN cnpj DROP NOT NULL;

-- Mantém UNIQUE (1 CNPJ = 1 Empresa) mas o postgres já permite múltiplos NULLs
-- em UNIQUE por padrão, então não precisa mudar a constraint.


-- ── Usuários: papel dentro da empresa ───────────────────────────────────────

-- Papel do usuário NA EMPRESA (não confundir com PerfilUsuario do sistema):
--   DONO     → criou a empresa, único que pode gerenciar membros e configurações
--   MEMBRO   → tem acesso a tudo da empresa, mas não gerencia membros
--   VISUALIZADOR → futuro: só leitura
-- Default: 'DONO' (todo usuário existente vira dono da sua empresa)
ALTER TABLE usuarios
    ADD COLUMN papel_empresa VARCHAR(20) NOT NULL DEFAULT 'DONO';

-- Constraint pra valores válidos
ALTER TABLE usuarios
    ADD CONSTRAINT chk_usuario_papel_empresa
        CHECK (papel_empresa IN ('DONO', 'MEMBRO', 'VISUALIZADOR'));


-- ── Rastreabilidade de quem criou a empresa ─────────────────────────────────

-- Identifica quem criou a empresa (o DONO original)
-- Pode ser null pra empresas legadas sem dono identificável
ALTER TABLE empresas
    ADD COLUMN criador_usuario_id UUID;

ALTER TABLE empresas
    ADD CONSTRAINT fk_empresa_criador
        FOREIGN KEY (criador_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;