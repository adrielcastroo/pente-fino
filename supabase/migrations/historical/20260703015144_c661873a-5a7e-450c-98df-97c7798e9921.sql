
-- 1) Colunas de tracking em nfe_entrada
ALTER TABLE public.nfe_entrada
  ADD COLUMN IF NOT EXISTS transportadora text,
  ADD COLUMN IF NOT EXISTS tracking_status text NOT NULL DEFAULT 'DESCONHECIDO'
    CHECK (tracking_status IN ('POSTADO','EM_TRANSITO','SAIU_PARA_ENTREGA','ENTREGUE','TENTATIVA_FALHA','EXCECAO','DESCONHECIDO')),
  ADD COLUMN IF NOT EXISTS tracking_provider text,
  ADD COLUMN IF NOT EXISTS tracking_last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_url text;

CREATE INDEX IF NOT EXISTS idx_nfe_entrada_tracking_status
  ON public.nfe_entrada (tracking_status);
CREATE INDEX IF NOT EXISTS idx_nfe_entrada_tracking_last_sync
  ON public.nfe_entrada (tracking_last_sync_at);

-- 2) Tabela de eventos de tracking
CREATE TABLE IF NOT EXISTS public.nfe_entrada_tracking_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_entrada_id uuid NOT NULL REFERENCES public.nfe_entrada(id) ON DELETE CASCADE,
  data_evento timestamptz NOT NULL,
  status text,
  local text,
  descricao text,
  fonte text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nfe_entrada_id, data_evento, status, descricao)
);

CREATE INDEX IF NOT EXISTS idx_tracking_eventos_nfe
  ON public.nfe_entrada_tracking_eventos (nfe_entrada_id, data_evento DESC);

GRANT SELECT, INSERT ON public.nfe_entrada_tracking_eventos TO authenticated;
GRANT ALL ON public.nfe_entrada_tracking_eventos TO service_role;

ALTER TABLE public.nfe_entrada_tracking_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expedicao members can view tracking eventos"
  ON public.nfe_entrada_tracking_eventos
  FOR SELECT
  TO authenticated
  USING (public.has_module('expedicao'));

CREATE POLICY "Expedicao members can insert tracking eventos"
  ON public.nfe_entrada_tracking_eventos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_module('expedicao'));
