ALTER TABLE public.estoque_posicoes 
ADD COLUMN composicao TEXT,
ADD COLUMN gramatura NUMERIC,
ADD COLUMN largura_util NUMERIC,
ADD COLUMN fornecedor TEXT,
ADD COLUMN codigo_cor TEXT,
ADD COLUMN preco_metro NUMERIC,
ADD COLUMN estoque_minimo NUMERIC DEFAULT 0;

-- Update the estoque_saidas table as well to keep history consistent
ALTER TABLE public.estoque_saidas
ADD COLUMN composicao TEXT,
ADD COLUMN gramatura NUMERIC,
ADD COLUMN largura_util NUMERIC,
ADD COLUMN fornecedor TEXT,
ADD COLUMN codigo_cor TEXT,
ADD COLUMN preco_metro NUMERIC;