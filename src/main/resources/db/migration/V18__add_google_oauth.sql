-- ══════════════════════════════════════════════════════════════════
-- 📁 DESTINO:
--   src/main/resources/db/migration/V18__add_google_oauth.sql
--
--   (criar arquivo NOVO; segue a sequência depois de
--    V17__create_cnab_ai_knowledge_base.sql)
-- ══════════════════════════════════════════════════════════════════
--
-- Migration V18: adicionar suporte a login com Google
--
-- Alterações:
--   1. Torna senha_hash opcional (usuários do Google não têm senha local)
--   2. Adiciona colunas: google_id, provedor_auth, foto_url
--   3. Cria índice único em google_id
--   4. CHECK: garante que todo usuário tem ao menos uma forma de credencial
--
-- Compatível com usuários existentes (todos ficam como provedor_auth='LOCAL').
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Tornar senha_hash nullable
ALTER TABLE usuarios
    ALTER COLUMN senha_hash DROP NOT NULL;

-- 2. Adicionar colunas de OAuth
ALTER TABLE usuarios
    ADD COLUMN google_id     VARCHAR(100),
    ADD COLUMN provedor_auth VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN foto_url      VARCHAR(500);

-- 3. Constraint: google_id deve ser único quando preenchido
CREATE UNIQUE INDEX idx_usuarios_google_id
    ON usuarios(google_id)
    WHERE google_id IS NOT NULL;

-- 4. Constraint: usuário LOCAL precisa ter senha; usuário GOOGLE precisa ter google_id
ALTER TABLE usuarios
    ADD CONSTRAINT chk_provedor_credencial CHECK (
        (provedor_auth = 'LOCAL'  AND senha_hash IS NOT NULL) OR
        (provedor_auth = 'GOOGLE' AND google_id  IS NOT NULL)
        );

COMMIT;

-- ──────────────────────────────────────────────────────────────────
-- Rollback manual (caso precise reverter):
--
-- BEGIN;
-- ALTER TABLE usuarios DROP CONSTRAINT chk_provedor_credencial;
-- DROP INDEX idx_usuarios_google_id;
-- ALTER TABLE usuarios
--     DROP COLUMN foto_url,
--     DROP COLUMN provedor_auth,
--     DROP COLUMN google_id;
-- ALTER TABLE usuarios ALTER COLUMN senha_hash SET NOT NULL;
-- COMMIT;
-- ──────────────────────────────────────────────────────────────────