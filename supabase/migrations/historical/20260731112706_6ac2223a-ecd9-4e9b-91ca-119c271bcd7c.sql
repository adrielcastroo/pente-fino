CREATE TABLE public.tecido_kit_vinculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_codigo text NOT NULL,
  kit_descricao text,
  tecido_codigo text,
  tecido_descricao text,
  origem text NOT NULL DEFAULT 'auto' CHECK (origem IN ('auto','manual')),
  score numeric,
  confirmado boolean NOT NULL DEFAULT false,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tecido_kit_vinculos_kit_unico UNIQUE (kit_codigo)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tecido_kit_vinculos TO authenticated;
GRANT ALL ON public.tecido_kit_vinculos TO service_role;

ALTER TABLE public.tecido_kit_vinculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vinculos_select_auth" ON public.tecido_kit_vinculos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "vinculos_insert_auth" ON public.tecido_kit_vinculos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vinculos_update_auth" ON public.tecido_kit_vinculos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vinculos_delete_auth" ON public.tecido_kit_vinculos
  FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_tecido_kit_vinculos_tecido ON public.tecido_kit_vinculos (tecido_codigo);

CREATE TRIGGER trg_tecido_kit_vinculos_updated_at
  BEFORE UPDATE ON public.tecido_kit_vinculos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();