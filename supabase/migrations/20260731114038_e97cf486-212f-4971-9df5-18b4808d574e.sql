CREATE TABLE public.compras_saldo_baixo_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referencia DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  origem TEXT,
  arquivo_nome TEXT,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_linhas INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_saldo_baixo_snapshots TO authenticated;
GRANT ALL ON public.compras_saldo_baixo_snapshots TO service_role;

ALTER TABLE public.compras_saldo_baixo_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_select_auth" ON public.compras_saldo_baixo_snapshots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "snapshots_insert_own" ON public.compras_saldo_baixo_snapshots
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "snapshots_delete_own_or_admin" ON public.compras_saldo_baixo_snapshots
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_at_least('supervisor'::app_role));

CREATE INDEX idx_csbs_referencia ON public.compras_saldo_baixo_snapshots (referencia DESC, created_at DESC);

CREATE TRIGGER trg_csbs_updated_at
  BEFORE UPDATE ON public.compras_saldo_baixo_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();