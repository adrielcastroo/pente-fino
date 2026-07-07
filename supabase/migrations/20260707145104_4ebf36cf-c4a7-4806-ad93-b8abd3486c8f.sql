
SET LOCAL statement_timeout = '180s';

-- Índice funcional para acelerar o match por código normalizado no histórico
CREATE INDEX IF NOT EXISTS idx_registros_item_norm
  ON public.registros ((public.normalizar_codigo(item)));

-- Backfill set-based: cada registro recebe a descrição do cadastro
-- cujo código interno OU qualquer código do fornecedor bate.
WITH cad AS (
  SELECT
    ic.descricao,
    public.normalizar_codigo(ic.codigo_interno) AS norm
  FROM public.itens_cadastro ic
  WHERE ic.descricao IS NOT NULL AND btrim(ic.descricao) <> ''
  UNION
  SELECT
    ic.descricao,
    unnest(ic.codigos_fornecedor_normalizado) AS norm
  FROM public.itens_cadastro ic
  WHERE ic.descricao IS NOT NULL
    AND btrim(ic.descricao) <> ''
    AND ic.codigos_fornecedor_normalizado IS NOT NULL
    AND array_length(ic.codigos_fornecedor_normalizado, 1) > 0
)
UPDATE public.registros r
   SET item = c.descricao
  FROM cad c
 WHERE c.norm = public.normalizar_codigo(r.item)
   AND r.item IS DISTINCT FROM c.descricao;
