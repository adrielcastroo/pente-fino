CREATE TABLE public.nfe_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  cnpj TEXT NOT NULL,
  tipo TEXT NOT NULL,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nfe_cache_expires ON public.nfe_cache(expires_at);
CREATE INDEX idx_nfe_cache_cnpj_tipo ON public.nfe_cache(cnpj, tipo);

GRANT SELECT ON public.nfe_cache TO authenticated;
GRANT ALL ON public.nfe_cache TO service_role;

ALTER TABLE public.nfe_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated pode ler cache de nfe"
ON public.nfe_cache FOR SELECT TO authenticated
USING (public.has_module('expedicao'));