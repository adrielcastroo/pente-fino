
ALTER TABLE public.auge_movimentacoes 
  ALTER COLUMN codigo_produto DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS situacao text,
  ADD COLUMN IF NOT EXISTS ds_situacao text,
  ADD COLUMN IF NOT EXISTS usuario_criacao text,
  ADD COLUMN IF NOT EXISTS usuario_efetivacao text,
  ADD COLUMN IF NOT EXISTS dt_efetivacao timestamptz,
  ADD COLUMN IF NOT EXISTS documento_tipo text,
  ADD COLUMN IF NOT EXISTS valor numeric,
  ADD COLUMN IF NOT EXISTS ds_efetivacao text,
  ADD COLUMN IF NOT EXISTS cd_transferencia text;

CREATE INDEX IF NOT EXISTS idx_auge_mov_situacao ON public.auge_movimentacoes(situacao);
CREATE INDEX IF NOT EXISTS idx_auge_mov_tipo ON public.auge_movimentacoes(tipo);
