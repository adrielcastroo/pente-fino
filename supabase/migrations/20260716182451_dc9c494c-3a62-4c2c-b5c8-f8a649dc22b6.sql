
CREATE TABLE IF NOT EXISTS public.auge_transferencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_externo TEXT NOT NULL UNIQUE,
  deposito_origem TEXT,
  deposito_destino TEXT,
  codigo_produto TEXT,
  quantidade NUMERIC DEFAULT 0,
  situacao TEXT,
  ds_situacao TEXT,
  data_movimento TIMESTAMPTZ,
  usuario_criacao TEXT,
  valor NUMERIC,
  documento TEXT,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auge_transferencias TO authenticated;
GRANT ALL ON public.auge_transferencias TO service_role;

ALTER TABLE public.auge_transferencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auge_transferencias_read_auth" ON public.auge_transferencias;
CREATE POLICY "auge_transferencias_read_auth" ON public.auge_transferencias
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_auge_transferencias_data ON public.auge_transferencias(data_movimento DESC);
CREATE INDEX IF NOT EXISTS idx_auge_transferencias_produto ON public.auge_transferencias(codigo_produto);

ALTER TABLE public.auge_depositos
  ADD COLUMN IF NOT EXISTS tipo TEXT,
  ADD COLUMN IF NOT EXISTS empresa TEXT,
  ADD COLUMN IF NOT EXISTS filial TEXT;
