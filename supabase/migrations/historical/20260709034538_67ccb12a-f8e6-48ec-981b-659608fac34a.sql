-- Enum de status de pedido de compra
DO $$ BEGIN
  CREATE TYPE public.compras_pedido_status AS ENUM ('pendente','em_andamento','recebido','atrasado','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela principal
CREATE TABLE IF NOT EXISTS public.compras_pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  status public.compras_pedido_status NOT NULL DEFAULT 'pendente',
  itens INTEGER NOT NULL DEFAULT 0,
  valor_total NUMERIC(14,2),
  previsao DATE,
  observacao TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS compras_pedidos_numero_key ON public.compras_pedidos (numero);
CREATE INDEX IF NOT EXISTS compras_pedidos_status_idx ON public.compras_pedidos (status);
CREATE INDEX IF NOT EXISTS compras_pedidos_previsao_idx ON public.compras_pedidos (previsao);
CREATE INDEX IF NOT EXISTS compras_pedidos_created_at_idx ON public.compras_pedidos (created_at DESC);

-- Grants (Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_pedidos TO authenticated;
GRANT ALL ON public.compras_pedidos TO service_role;

-- RLS
ALTER TABLE public.compras_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compras_pedidos_select_authenticated"
  ON public.compras_pedidos FOR SELECT TO authenticated USING (true);

CREATE POLICY "compras_pedidos_insert_authenticated"
  ON public.compras_pedidos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "compras_pedidos_update_authenticated"
  ON public.compras_pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "compras_pedidos_delete_supervisor"
  ON public.compras_pedidos FOR DELETE TO authenticated
  USING (public.is_at_least('supervisor'::public.app_role));

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_compras_pedidos_updated_at ON public.compras_pedidos;
CREATE TRIGGER trg_compras_pedidos_updated_at
  BEFORE UPDATE ON public.compras_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de auditoria (reaproveita audit_row_change existente)
DROP TRIGGER IF EXISTS trg_compras_pedidos_audit ON public.compras_pedidos;
CREATE TRIGGER trg_compras_pedidos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.compras_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
