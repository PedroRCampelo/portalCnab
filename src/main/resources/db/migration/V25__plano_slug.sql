-- ═════════════════════════════════════════════════════════════════════════════
-- V25 — Adiciona slug em planos (Sprint 2.2-A1.4)
--
-- Slug é um identificador estável e legível usado pelo código pra
-- diferenciar planos sem depender de UUIDs hardcoded.
--
-- Mapeamento:
--   ID                                       | nome      | slug
--   10000000-0000-0000-0000-000000000001    | gratuito  | gratuito
--   10000000-0000-0000-0000-000000000002    | pro       | pro
--   10000000-0000-0000-0000-000000000003    | Whallet+  | whallet-plus
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE planos
    ADD COLUMN slug VARCHAR(50);

-- Popula slugs nos planos existentes
UPDATE planos SET slug = 'gratuito'      WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE planos SET slug = 'pro'           WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE planos SET slug = 'whallet-plus'  WHERE id = '10000000-0000-0000-0000-000000000003';

-- Torna obrigatório e único
ALTER TABLE planos
    ALTER COLUMN slug SET NOT NULL;

ALTER TABLE planos
    ADD CONSTRAINT uk_planos_slug UNIQUE (slug);

-- Comentário pra documentar
COMMENT ON COLUMN planos.slug IS 'Identificador estável usado pelo código (ex: whallet-plus, pro, gratuito)';