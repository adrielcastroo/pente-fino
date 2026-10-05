
-- Helper: usuário tem acesso ao módulo?
CREATE OR REPLACE FUNCTION public.has_module(_module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND _module = ANY(COALESCE(modules, ARRAY['estoque']::text[]))
  );
$$;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.expedicao_picking_status AS ENUM
    ('aguardando','em_separacao','em_conferencia','conferido','faturado','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expedicao_carrinho_status AS ENUM
    ('livre','em_uso','manutencao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Transportadoras
CREATE TABLE public.expedicao_transportadoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_transportadoras TO authenticated;
GRANT ALL ON public.expedicao_transportadoras TO service_role;
ALTER TABLE public.expedicao_transportadoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao_transp_read" ON public.expedicao_transportadoras
  FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao_transp_write" ON public.expedicao_transportadoras
  FOR ALL TO authenticated
  USING (public.has_module('expedicao')) WITH CHECK (public.has_module('expedicao'));

-- Carrinhos
CREATE TABLE public.expedicao_carrinhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  status public.expedicao_carrinho_status NOT NULL DEFAULT 'livre',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_carrinhos TO authenticated;
GRANT ALL ON public.expedicao_carrinhos TO service_role;
ALTER TABLE public.expedicao_carrinhos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao_carr_read" ON public.expedicao_carrinhos
  FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao_carr_write" ON public.expedicao_carrinhos
  FOR ALL TO authenticated
  USING (public.has_module('expedicao')) WITH CHECK (public.has_module('expedicao'));

-- Pickings
CREATE TABLE public.expedicao_pickings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  cliente TEXT NOT NULL,
  cidade TEXT,
  regiao TEXT,
  transportadora_id UUID REFERENCES public.expedicao_transportadoras(id) ON DELETE SET NULL,
  carrinho_id UUID REFERENCES public.expedicao_carrinhos(id) ON DELETE SET NULL,
  status public.expedicao_picking_status NOT NULL DEFAULT 'aguardando',
  total_pecas INT NOT NULL DEFAULT 0,
  observacao TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exp_pickings_status ON public.expedicao_pickings(status);
CREATE INDEX idx_exp_pickings_transp ON public.expedicao_pickings(transportadora_id);
CREATE INDEX idx_exp_pickings_carrinho ON public.expedicao_pickings(carrinho_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_pickings TO authenticated;
GRANT ALL ON public.expedicao_pickings TO service_role;
ALTER TABLE public.expedicao_pickings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao_pk_read" ON public.expedicao_pickings
  FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao_pk_write" ON public.expedicao_pickings
  FOR ALL TO authenticated
  USING (public.has_module('expedicao')) WITH CHECK (public.has_module('expedicao'));

-- Itens do picking
CREATE TABLE public.expedicao_picking_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  picking_id UUID NOT NULL REFERENCES public.expedicao_pickings(id) ON DELETE CASCADE,
  codigo_peca TEXT NOT NULL,
  descricao TEXT,
  qtd_prevista INT NOT NULL DEFAULT 1,
  qtd_bipada INT NOT NULL DEFAULT 0,
  bipado_at TIMESTAMPTZ,
  bipado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exp_pkitens_picking ON public.expedicao_picking_itens(picking_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_picking_itens TO authenticated;
GRANT ALL ON public.expedicao_picking_itens TO service_role;
ALTER TABLE public.expedicao_picking_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao_pki_read" ON public.expedicao_picking_itens
  FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao_pki_write" ON public.expedicao_picking_itens
  FOR ALL TO authenticated
  USING (public.has_module('expedicao')) WITH CHECK (public.has_module('expedicao'));

-- Triggers updated_at
CREATE TRIGGER trg_exp_transp_updated BEFORE UPDATE ON public.expedicao_transportadoras
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_exp_carr_updated BEFORE UPDATE ON public.expedicao_carrinhos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_exp_pk_updated BEFORE UPDATE ON public.expedicao_pickings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_exp_pki_updated BEFORE UPDATE ON public.expedicao_picking_itens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
