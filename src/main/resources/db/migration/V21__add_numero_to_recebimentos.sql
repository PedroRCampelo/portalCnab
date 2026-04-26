-- V21: Adiciona coluna `numero` em recebimentos para agrupar parcelas.
--
-- Mesmo padrão usado em `titulos` (contas a pagar):
--   - Recebimentos parcelados compartilham o mesmo `numero`
--   - Diferenciam-se por `parcela_atual`/`parcela_total`
--   - Permite rastrear "todas parcelas do recebimento X"
--
-- `numero` é nullable porque recebimentos antigos (criados antes desta migration)
-- não têm número. Recebimentos novos sempre receberão um (gerado pelo backend).

BEGIN;

ALTER TABLE recebimentos
    ADD COLUMN numero VARCHAR(20);

-- Índice composto pra busca eficiente de "todas parcelas do recebimento N na empresa X"
CREATE INDEX idx_receb_empresa_numero ON recebimentos(empresa_id, numero);

-- Backfill: gera um número único pra recebimentos existentes
-- (formato R-<uuid prefixo> — só pra não ficar null e quebrar futuras consultas)
UPDATE recebimentos
SET numero = 'R-' || SUBSTRING(id::text, 1, 8)
WHERE numero IS NULL;

COMMIT;