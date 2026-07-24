
CREATE TABLE IF NOT EXISTS public.auge_tag_audit_hits (
  run_id uuid NOT NULL,
  cd_configuracao text NOT NULL,
  nm_configuracao text,
  prefix text,
  found_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, cd_configuracao)
);
CREATE INDEX IF NOT EXISTS idx_auge_tag_audit_hits_run ON public.auge_tag_audit_hits(run_id);

GRANT SELECT ON public.auge_tag_audit_hits TO authenticated;
GRANT ALL ON public.auge_tag_audit_hits TO service_role;

ALTER TABLE public.auge_tag_audit_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auge_tag_audit_hits_read_authenticated"
  ON public.auge_tag_audit_hits FOR SELECT
  TO authenticated
  USING (true);
