
CREATE TABLE public.itens_cadastro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_interno TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  codigo_fornecedor TEXT NOT NULL,
  codigo_fornecedor_normalizado TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_itens_cadastro_codigo_interno ON public.itens_cadastro (codigo_interno);
CREATE INDEX idx_itens_cadastro_fornecedor_norm ON public.itens_cadastro (codigo_fornecedor_normalizado);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_cadastro TO authenticated;
GRANT ALL ON public.itens_cadastro TO service_role;

ALTER TABLE public.itens_cadastro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view itens_cadastro"
  ON public.itens_cadastro FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert itens_cadastro"
  ON public.itens_cadastro FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update itens_cadastro"
  ON public.itens_cadastro FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete itens_cadastro"
  ON public.itens_cadastro FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_itens_cadastro_updated_at
  BEFORE UPDATE ON public.itens_cadastro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
