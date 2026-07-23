
CREATE TABLE IF NOT EXISTS public.auge_tag_custom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cd_configuracao TEXT NOT NULL,
  nm_configuracao TEXT,
  cd_tag_customizada TEXT,
  nm_tag_customizada TEXT,
  ds_tag_customizada TEXT,
  cd_tag_calculada TEXT,
  ds_tag_calculada TEXT,
  ds_tag_texto TEXT,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cd_configuracao, cd_tag_customizada)
);
CREATE INDEX IF NOT EXISTS idx_auge_tag_custom_cfg ON public.auge_tag_custom(cd_configuracao);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auge_tag_custom TO authenticated;
GRANT ALL ON public.auge_tag_custom TO service_role;

ALTER TABLE public.auge_tag_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auge_tag_custom read authenticated" ON public.auge_tag_custom FOR SELECT TO authenticated USING (true);
CREATE POLICY "auge_tag_custom write service" ON public.auge_tag_custom FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tabela de status de scan por configuração (para saber quais foram escaneados e não tem tag)
CREATE TABLE IF NOT EXISTS public.auge_tag_custom_scan (
  cd_configuracao TEXT PRIMARY KEY,
  nm_configuracao TEXT,
  qtd_tags INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  erro TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auge_tag_custom_scan TO authenticated;
GRANT ALL ON public.auge_tag_custom_scan TO service_role;
ALTER TABLE public.auge_tag_custom_scan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auge_tag_custom_scan read authenticated" ON public.auge_tag_custom_scan FOR SELECT TO authenticated USING (true);
CREATE POLICY "auge_tag_custom_scan write service" ON public.auge_tag_custom_scan FOR ALL TO service_role USING (true) WITH CHECK (true);
