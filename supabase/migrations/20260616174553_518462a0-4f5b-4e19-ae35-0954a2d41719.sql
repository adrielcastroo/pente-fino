
ALTER TABLE public.itens_cadastro
  ADD COLUMN IF NOT EXISTS codigos_fornecedor TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS codigos_fornecedor_normalizado TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.itens_cadastro
SET codigos_fornecedor = ARRAY[codigo_fornecedor],
    codigos_fornecedor_normalizado = ARRAY[codigo_fornecedor_normalizado]
WHERE codigo_fornecedor IS NOT NULL
  AND codigo_fornecedor <> ''
  AND (codigos_fornecedor IS NULL OR array_length(codigos_fornecedor, 1) IS NULL);

CREATE INDEX IF NOT EXISTS idx_itens_cadastro_codigos_fornecedor_norm
  ON public.itens_cadastro USING GIN (codigos_fornecedor_normalizado);
