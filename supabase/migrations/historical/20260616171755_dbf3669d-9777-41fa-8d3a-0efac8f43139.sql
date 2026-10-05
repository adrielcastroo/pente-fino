ALTER TABLE public.itens_cadastro ALTER COLUMN codigo_fornecedor DROP NOT NULL;
ALTER TABLE public.itens_cadastro ALTER COLUMN codigo_fornecedor_normalizado DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_itens_cadastro_forn_norm ON public.itens_cadastro(codigo_fornecedor_normalizado) WHERE codigo_fornecedor_normalizado IS NOT NULL;