CREATE TABLE IF NOT EXISTS public.auge_tags_calculadas (
  cd_tag text PRIMARY KEY,
  nm_tag text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auge_tags_calculadas TO authenticated;
GRANT ALL ON public.auge_tags_calculadas TO service_role;

ALTER TABLE public.auge_tags_calculadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auge_tags_calculadas_select_auth"
ON public.auge_tags_calculadas
FOR SELECT
TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_auge_tags_calculadas_nm ON public.auge_tags_calculadas (nm_tag);