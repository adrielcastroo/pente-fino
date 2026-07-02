
ALTER TABLE public.nfe_importadas
  ADD COLUMN IF NOT EXISTS protocolo_autorizacao TEXT,
  ADD COLUMN IF NOT EXISTS situacao_sefaz TEXT,
  ADD COLUMN IF NOT EXISTS data_autorizacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consultado_sefaz_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS danfe_path TEXT,
  ADD COLUMN IF NOT EXISTS xml_path TEXT;
