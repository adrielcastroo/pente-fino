ALTER TABLE public.itens_cadastro
  ADD COLUMN IF NOT EXISTS unidade TEXT,
  ADD COLUMN IF NOT EXISTS pacote_fornecedor NUMERIC,
  ADD COLUMN IF NOT EXISTS pacote_estocagem NUMERIC;