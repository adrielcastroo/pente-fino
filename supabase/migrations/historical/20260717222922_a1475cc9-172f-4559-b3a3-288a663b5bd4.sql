
ALTER TABLE public.auge_transferencias
  ADD COLUMN IF NOT EXISTS usuario_efetivacao text,
  ADD COLUMN IF NOT EXISTS usuario_enviou_logistica text,
  ADD COLUMN IF NOT EXISTS usuario_recebido_logistica text,
  ADD COLUMN IF NOT EXISTS detalhe_sincronizado_em timestamptz;
