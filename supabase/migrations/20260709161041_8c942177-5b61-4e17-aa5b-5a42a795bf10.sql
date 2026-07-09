CREATE TYPE public.compras_starcolor_op_status AS ENUM ('aberta','na_starcolor','retornou','finalizada');

CREATE TABLE public.compras_starcolor_ops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_op TEXT NOT NULL,
  numero_nf TEXT,
  descricao TEXT,
  quantidade NUMERIC,
  status public.compras_starcolor_op_status NOT NULL DEFAULT 'aberta',
  data_envio DATE,
  data_retorno DATE,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compras_starcolor_ops_status ON public.compras_starcolor_ops(status);
CREATE INDEX idx_compras_starcolor_ops_created_at ON public.compras_starcolor_ops(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_starcolor_ops TO authenticated;
GRANT ALL ON public.compras_starcolor_ops TO service_role;

ALTER TABLE public.compras_starcolor_ops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view starcolor ops"
  ON public.compras_starcolor_ops FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert starcolor ops"
  ON public.compras_starcolor_ops FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update starcolor ops"
  ON public.compras_starcolor_ops FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete starcolor ops"
  ON public.compras_starcolor_ops FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER compras_starcolor_ops_updated_at
  BEFORE UPDATE ON public.compras_starcolor_ops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();