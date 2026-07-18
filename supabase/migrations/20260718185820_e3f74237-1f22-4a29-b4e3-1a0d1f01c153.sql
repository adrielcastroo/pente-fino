
ALTER TABLE public.estoque_posicoes
  ADD COLUMN IF NOT EXISTS deposito_atual text,
  ADD COLUMN IF NOT EXISTS m_linear_atual numeric,
  ADD COLUMN IF NOT EXISTS m2_atual numeric,
  ADD COLUMN IF NOT EXISTS auge_cd_item text;

CREATE INDEX IF NOT EXISTS idx_estoque_posicoes_lote_sistema ON public.estoque_posicoes (lote_sistema);
CREATE INDEX IF NOT EXISTS idx_estoque_posicoes_auge_cd_item ON public.estoque_posicoes (auge_cd_item);
