
ALTER TABLE public.auge_produtos
  ADD COLUMN IF NOT EXISTS id_estoque BOOLEAN,
  ADD COLUMN IF NOT EXISTS id_venda BOOLEAN,
  ADD COLUMN IF NOT EXISTS id_compra BOOLEAN,
  ADD COLUMN IF NOT EXISTS qt_estoque NUMERIC,
  ADD COLUMN IF NOT EXISTS qt_disponivel NUMERIC,
  ADD COLUMN IF NOT EXISTS qt_entrada_prevista NUMERIC,
  ADD COLUMN IF NOT EXISTS qt_saida_prevista NUMERIC;

CREATE INDEX IF NOT EXISTS idx_auge_produtos_categoria ON public.auge_produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_auge_produtos_ativo ON public.auge_produtos(ativo);
