-- ─────────────────────────────────────────────────────────────────────────────
-- Migration V5: Correção do tipo da coluna perfil em produção
--
-- Problema: V2 original criou perfil como ENUM perfil_usuario,
-- mas a aplicação envia VARCHAR. Isso causa erro de tipo no PostgreSQL.
--
-- Solução: converter a coluna para VARCHAR(20) e remover o ENUM.
-- ─────────────────────────────────────────────────────────────────────────────

-- Converte perfil de ENUM para VARCHAR (USING faz o cast automatico)
ALTER TABLE usuarios
ALTER COLUMN perfil TYPE VARCHAR(20) USING perfil::text;

-- Remove o tipo ENUM que nao e mais necessario
DROP TYPE IF EXISTS perfil_usuario;

-- Garante que o admin ficticio esteja desativado
UPDATE usuarios SET ativo = false WHERE email = 'admin@portalcnab.local';

-- Garante perfil correto para usuarios existentes
UPDATE usuarios SET perfil = 'ADMIN'    WHERE perfil IS NULL OR perfil = '';
UPDATE usuarios SET perfil = 'OPERADOR' WHERE perfil NOT IN ('ADMIN', 'OPERADOR', 'VISUALIZADOR');