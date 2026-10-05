
-- Produtos (cadastro mestre)
CREATE TABLE IF NOT EXISTS public.auge_produtos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  descricao text,
  unidade text,
  ncm text,
  categoria text,
  ativo boolean DEFAULT true,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.auge_produtos TO authenticated;
GRANT ALL ON public.auge_produtos TO service_role;
ALTER TABLE public.auge_produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auge_produtos read authed" ON public.auge_produtos FOR SELECT TO authenticated USING (true);

-- Depósitos
CREATE TABLE IF NOT EXISTS public.auge_depositos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nome text,
  localizacao text,
  ativo boolean DEFAULT true,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.auge_depositos TO authenticated;
GRANT ALL ON public.auge_depositos TO service_role;
ALTER TABLE public.auge_depositos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auge_depositos read authed" ON public.auge_depositos FOR SELECT TO authenticated USING (true);

-- Movimentações
CREATE TABLE IF NOT EXISTS public.auge_movimentacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_externo text UNIQUE,
  tipo text NOT NULL,
  codigo_produto text NOT NULL,
  deposito text,
  quantidade numeric NOT NULL DEFAULT 0,
  documento text,
  data_movimento timestamptz,
  observacao text,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auge_mov_codigo ON public.auge_movimentacoes(codigo_produto);
CREATE INDEX IF NOT EXISTS idx_auge_mov_data ON public.auge_movimentacoes(data_movimento DESC);
GRANT SELECT ON public.auge_movimentacoes TO authenticated;
GRANT ALL ON public.auge_movimentacoes TO service_role;
ALTER TABLE public.auge_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auge_mov read authed" ON public.auge_movimentacoes FOR SELECT TO authenticated USING (true);

-- Lotes
CREATE TABLE IF NOT EXISTS public.auge_lotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_produto text NOT NULL,
  lote text NOT NULL,
  deposito text,
  quantidade numeric DEFAULT 0,
  data_fabricacao date,
  data_validade date,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (codigo_produto, lote, deposito)
);
CREATE INDEX IF NOT EXISTS idx_auge_lotes_prod ON public.auge_lotes(codigo_produto);
GRANT SELECT ON public.auge_lotes TO authenticated;
GRANT ALL ON public.auge_lotes TO service_role;
ALTER TABLE public.auge_lotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auge_lotes read authed" ON public.auge_lotes FOR SELECT TO authenticated USING (true);

-- Extender sync_runs para saber qual entidade foi sincronizada
ALTER TABLE public.auge_sync_runs ADD COLUMN IF NOT EXISTS entidade text;
ALTER TABLE public.auge_sync_runs ADD COLUMN IF NOT EXISTS detalhes jsonb;
