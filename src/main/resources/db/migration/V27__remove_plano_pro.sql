-- ═════════════════════════════════════════════════════════════════════════════
-- V27 — Deletar plano Pro (Sprint A2.7)
--
-- Decisão de produto: Whallet vai operar com 2 planos:
--   - Free       → CNAB validação + visualização das telas (sem escrita)
--   - Whallet+   → Tudo (com fair-use de IA)
--
-- O plano Pro era do Whallet antigo (foco CNAB ilimitado).
-- Não faz mais sentido com o pivô pra ERP financeiro.
--
-- IMPORTANTE: como o produto não tem clientes pagantes ainda,
-- DELETE físico não causa problema. Em produção com clientes Pro,
-- a estratégia seria migrar pra Whallet+ antes de deletar.
-- ═════════════════════════════════════════════════════════════════════════════


-- 1. Migra qualquer usuário que esteja no Pro pro Free (segurança)
UPDATE usuarios
SET plano_id = '10000000-0000-0000-0000-000000000001',  -- Free
    assinatura_status = 'SEM_ASSINATURA'
WHERE plano_id = '10000000-0000-0000-0000-000000000002';  -- Pro


-- 2. Deleta o plano Pro
DELETE FROM planos
WHERE id = '10000000-0000-0000-0000-000000000002'
  AND slug = 'pro';


-- 3. Atualiza descrição dos planos restantes pra refletir a nova estratégia

UPDATE planos
SET descricao = 'Validação de CNAB ilimitada e visualização das telas de gestão',
    nome = 'Free'
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE planos
SET descricao = 'Gestão financeira completa: recebimentos, títulos, fluxo de caixa, DAS e Bot Elvis com fair-use'
WHERE id = '10000000-0000-0000-0000-000000000003';


-- 4. Confere
-- Esperado: 2 planos (free + whallet-plus)
SELECT id, slug, nome, preco_mensal, ativo FROM planos ORDER BY preco_mensal;