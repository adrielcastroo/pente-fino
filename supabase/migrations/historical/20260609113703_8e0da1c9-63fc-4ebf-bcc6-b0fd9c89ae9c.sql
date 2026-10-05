ALTER TABLE public.movimentacoes_endereco 
ADD COLUMN IF NOT EXISTS tipo_estoque TEXT DEFAULT 'OFICIAL',
ADD COLUMN IF NOT EXISTS status_integracao TEXT DEFAULT 'integrado',
ADD COLUMN IF NOT EXISTS quantidade NUMERIC,
ADD COLUMN IF NOT EXISTS descricao_item TEXT;

-- Update existing rows to have sensible defaults if they don't
UPDATE public.movimentacoes_endereco SET tipo_estoque = 'OFICIAL', status_integracao = 'integrado' WHERE tipo_estoque IS NULL;

-- Ensure RLS is still valid (it should be since we are just adding columns, but good to check)
-- No changes needed to policies if they are broad enough.
