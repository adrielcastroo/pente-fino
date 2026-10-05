
-- 1) Colunas extras em expedicao_pickings
ALTER TABLE public.expedicao_pickings
  ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS nfe_numero TEXT,
  ADD COLUMN IF NOT EXISTS nfe_valor NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS nfe_chave TEXT,
  ADD COLUMN IF NOT EXISTS faturado_at TIMESTAMPTZ;

-- 2) Tabela nfe_importadas
CREATE TABLE IF NOT EXISTS public.nfe_importadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  picking_id UUID REFERENCES public.expedicao_pickings(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  serie TEXT,
  chave_acesso TEXT UNIQUE NOT NULL,
  data_emissao TIMESTAMPTZ,
  cnpj_emitente TEXT,
  nome_emitente TEXT,
  cnpj_destinatario TEXT,
  nome_destinatario TEXT,
  valor_total NUMERIC(12,2),
  valor_produtos NUMERIC(12,2),
  valor_frete NUMERIC(12,2),
  transportadora TEXT,
  volumes INTEGER,
  peso_liquido NUMERIC(10,3),
  peso_bruto NUMERIC(10,3),
  itens JSONB,
  xml_raw TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfe_importadas TO authenticated;
GRANT ALL ON public.nfe_importadas TO service_role;

ALTER TABLE public.nfe_importadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_select_expedicao"
  ON public.nfe_importadas FOR SELECT
  TO authenticated
  USING (public.has_module('expedicao'));

CREATE POLICY "nfe_insert_supervisor"
  ON public.nfe_importadas FOR INSERT
  TO authenticated
  WITH CHECK (public.expedicao_has_at_least('supervisor'::public.app_role));

CREATE POLICY "nfe_update_supervisor"
  ON public.nfe_importadas FOR UPDATE
  TO authenticated
  USING (public.expedicao_has_at_least('supervisor'::public.app_role))
  WITH CHECK (public.expedicao_has_at_least('supervisor'::public.app_role));

CREATE POLICY "nfe_delete_gerente"
  ON public.nfe_importadas FOR DELETE
  TO authenticated
  USING (public.expedicao_has_at_least('gerente'::public.app_role));

CREATE INDEX IF NOT EXISTS nfe_importadas_picking_idx ON public.nfe_importadas(picking_id);
CREATE INDEX IF NOT EXISTS nfe_importadas_numero_idx ON public.nfe_importadas(numero);
CREATE INDEX IF NOT EXISTS nfe_importadas_data_idx ON public.nfe_importadas(data_emissao DESC);

CREATE TRIGGER update_nfe_importadas_updated_at
  BEFORE UPDATE ON public.nfe_importadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
