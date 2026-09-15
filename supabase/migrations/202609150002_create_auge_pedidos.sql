-- Tabela de pedidos sincronizados do Auge
-- Populada pela edge function auge-sync com action 'sync_pedidos'
BEGIN;

CREATE TABLE IF NOT EXISTS public.auge_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cd_pedido text NOT NULL,
  nr_pedido text,
  nome_cliente text,
  cliente_final text,
  supervisor text,
  dt_documento text,
  dt_efetivacao text,
  dt_entrega_prevista text,
  situacao_id integer,
  situacao text,
  status_tms text,
  nf_numero text,
  nf_serie text,
  vl_produtos numeric DEFAULT 0,
  vl_impostos numeric DEFAULT 0,
  vl_total numeric DEFAULT 0,
  sincronizado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auge_pedidos_cd_pedido ON public.auge_pedidos(cd_pedido);
CREATE INDEX IF NOT EXISTS idx_auge_pedidos_nome_cliente ON public.auge_pedidos(nome_cliente);
CREATE INDEX IF NOT EXISTS idx_auge_pedidos_dt_documento ON public.auge_pedidos(dt_documento);
CREATE INDEX IF NOT EXISTS idx_auge_pedidos_situacao ON public.auge_pedidos(situacao);
CREATE INDEX IF NOT EXISTS idx_auge_pedidos_sincronizado_em ON public.auge_pedidos(sincronizado_em DESC);

ALTER TABLE public.auge_pedidos ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_auge_pedidos_updated ON public.auge_pedidos;
CREATE TRIGGER trg_auge_pedidos_updated
  BEFORE UPDATE ON public.auge_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.auge_pedidos TO authenticated;
GRANT ALL ON public.auge_pedidos TO service_role;

COMMIT;
