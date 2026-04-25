-- Add columns to registros table for better inventory management
ALTER TABLE public.registros 
ADD COLUMN IF NOT EXISTS espessura NUMERIC,
ADD COLUMN IF NOT EXISTS acabamento TEXT,
ADD COLUMN IF NOT EXISTS estoque_minimo NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS composicao TEXT,
ADD COLUMN IF NOT EXISTS fornecedor TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disponivel';

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_registros_status ON public.registros(status);
CREATE INDEX IF NOT EXISTS idx_registros_modo_origem ON public.registros(modo_origem);
