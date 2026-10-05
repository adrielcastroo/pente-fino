-- Espelho de saldos do ERP Auge
CREATE TABLE public.auge_produtos_saldo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  descricao TEXT,
  deposito TEXT NOT NULL DEFAULT 'PADRAO',
  quantidade NUMERIC(14,4) NOT NULL DEFAULT 0,
  unidade TEXT,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (codigo, deposito)
);

CREATE INDEX idx_auge_saldo_codigo ON public.auge_produtos_saldo (codigo);
CREATE INDEX idx_auge_saldo_synced ON public.auge_produtos_saldo (synced_at DESC);

GRANT SELECT ON public.auge_produtos_saldo TO authenticated;
GRANT ALL ON public.auge_produtos_saldo TO service_role;

ALTER TABLE public.auge_produtos_saldo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auge_saldo_read_authenticated"
  ON public.auge_produtos_saldo FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auge_saldo_admin_write"
  ON public.auge_produtos_saldo FOR ALL
  TO authenticated
  USING (public.is_at_least('gerente'::public.app_role))
  WITH CHECK (public.is_at_least('gerente'::public.app_role));

CREATE TRIGGER trg_auge_saldo_updated
  BEFORE UPDATE ON public.auge_produtos_saldo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Log de execuções de sincronização
CREATE TABLE public.auge_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error','partial')),
  rows_processed INT NOT NULL DEFAULT 0,
  rows_upserted INT NOT NULL DEFAULT 0,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auge_sync_runs_started ON public.auge_sync_runs (started_at DESC);

GRANT SELECT ON public.auge_sync_runs TO authenticated;
GRANT ALL ON public.auge_sync_runs TO service_role;

ALTER TABLE public.auge_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auge_runs_read_authenticated"
  ON public.auge_sync_runs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auge_runs_admin_write"
  ON public.auge_sync_runs FOR ALL
  TO authenticated
  USING (public.is_at_least('gerente'::public.app_role))
  WITH CHECK (public.is_at_least('gerente'::public.app_role));