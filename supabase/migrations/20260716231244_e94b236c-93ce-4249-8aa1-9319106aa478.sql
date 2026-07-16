
-- 1. Estado de sync incremental por entidade
CREATE TABLE IF NOT EXISTS public.auge_sync_state (
  entidade text PRIMARY KEY,
  last_synced_at timestamptz,
  last_max_dt timestamptz,
  last_status text,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auge_sync_state TO authenticated;
GRANT ALL ON public.auge_sync_state TO service_role;

ALTER TABLE public.auge_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auge_sync_state admin read"
  ON public.auge_sync_state
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_auge_sync_state_updated ON public.auge_sync_state;
CREATE TRIGGER trg_auge_sync_state_updated
  BEFORE UPDATE ON public.auge_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Kardex unificado (saídas + transferências) — view herda RLS das tabelas base
CREATE OR REPLACE VIEW public.auge_kardex AS
SELECT
  'saida'::text          AS origem,
  m.id                   AS ref_id,
  m.codigo_produto,
  m.data_movimento,
  COALESCE(m.tipo,'saida') AS operacao,
  m.deposito             AS deposito_origem,
  NULL::text             AS deposito_destino,
  m.quantidade,
  m.documento,
  m.usuario_criacao,
  m.ds_situacao,
  m.valor,
  m.synced_at
FROM public.auge_movimentacoes m
UNION ALL
SELECT
  'transferencia'::text  AS origem,
  t.id                   AS ref_id,
  t.codigo_produto,
  t.data_movimento,
  'transferencia'::text  AS operacao,
  t.deposito_origem,
  t.deposito_destino,
  t.quantidade,
  t.documento,
  t.usuario_criacao,
  t.ds_situacao,
  t.valor,
  t.synced_at
FROM public.auge_transferencias t;

GRANT SELECT ON public.auge_kardex TO authenticated;

-- 3. Seed inicial das entidades que já sincronizam (para o painel mostrar status)
INSERT INTO public.auge_sync_state (entidade, last_status)
VALUES
  ('produtos',       'pending'),
  ('saldo',          'pending'),
  ('movimentacoes',  'pending'),
  ('transferencias', 'pending'),
  ('entradas',       'pending_har'),
  ('ajustes',        'pending_har'),
  ('lotes',          'pending_har'),
  ('saldo_deposito', 'pending_har')
ON CONFLICT (entidade) DO NOTHING;
