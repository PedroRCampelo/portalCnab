-- V5__fix_perfil_varchar.sql

DO $$
BEGIN
    -- cria a coluna se ela ainda não existir
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'usuarios'
          AND column_name = 'perfil'
    ) THEN
ALTER TABLE usuarios
    ADD COLUMN perfil VARCHAR(20);
END IF;
END $$;

DO $$
DECLARE
v_data_type text;
    v_udt_name  text;
BEGIN
SELECT data_type, udt_name
INTO v_data_type, v_udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
  AND column_name = 'perfil';

-- se ainda estiver como enum, converte para varchar
IF v_udt_name = 'perfil_usuario' THEN
ALTER TABLE usuarios
ALTER COLUMN perfil TYPE VARCHAR(20) USING perfil::text;
END IF;
END $$;

-- garante default e not null
ALTER TABLE usuarios
    ALTER COLUMN perfil SET DEFAULT 'OPERADOR';

UPDATE usuarios
SET perfil = 'OPERADOR'
WHERE perfil IS NULL OR TRIM(perfil) = '';

UPDATE usuarios
SET perfil = 'OPERADOR'
WHERE perfil NOT IN ('ADMIN', 'OPERADOR', 'VISUALIZADOR');

ALTER TABLE usuarios
    ALTER COLUMN perfil SET NOT NULL;

-- remove enum antigo só se não estiver mais em uso
DROP TYPE IF EXISTS perfil_usuario;

-- ajuste opcional do admin fictício
UPDATE usuarios
SET ativo = false
WHERE email = 'admin@portalcnab.local';