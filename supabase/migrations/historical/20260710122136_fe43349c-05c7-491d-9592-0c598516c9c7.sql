
-- Tabelas de Romaneios Starcolor (1 romaneio por cor, agrupados por NF)

CREATE TABLE public.compras_starcolor_romaneios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  numero_nf TEXT NOT NULL,
  cor TEXT NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  servico_adicional TEXT,
  acabamento TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','gerado','enviado','retornou','finalizado')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_starcolor_romaneios_nf ON public.compras_starcolor_romaneios (numero_nf);
CREATE INDEX idx_starcolor_romaneios_status ON public.compras_starcolor_romaneios (status);
CREATE INDEX idx_starcolor_romaneios_created_at ON public.compras_starcolor_romaneios (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_starcolor_romaneios TO authenticated;
GRANT ALL ON public.compras_starcolor_romaneios TO service_role;

ALTER TABLE public.compras_starcolor_romaneios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view romaneios starcolor"
  ON public.compras_starcolor_romaneios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert romaneios starcolor"
  ON public.compras_starcolor_romaneios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update romaneios starcolor"
  ON public.compras_starcolor_romaneios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete romaneios starcolor"
  ON public.compras_starcolor_romaneios FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_starcolor_romaneios_updated_at
  BEFORE UPDATE ON public.compras_starcolor_romaneios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Itens do romaneio
CREATE TABLE public.compras_starcolor_romaneio_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  romaneio_id UUID NOT NULL REFERENCES public.compras_starcolor_romaneios(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  codigo TEXT,
  qtd_pecas NUMERIC(12,3),
  tam_barras NUMERIC(12,3),
  peso_liq NUMERIC(12,3),
  op_id UUID REFERENCES public.compras_starcolor_ops(id) ON DELETE SET NULL,
  op_texto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_starcolor_romaneio_itens_romaneio ON public.compras_starcolor_romaneio_itens (romaneio_id, ordem);
CREATE INDEX idx_starcolor_romaneio_itens_op ON public.compras_starcolor_romaneio_itens (op_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_starcolor_romaneio_itens TO authenticated;
GRANT ALL ON public.compras_starcolor_romaneio_itens TO service_role;

ALTER TABLE public.compras_starcolor_romaneio_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view romaneio itens"
  ON public.compras_starcolor_romaneio_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert romaneio itens"
  ON public.compras_starcolor_romaneio_itens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update romaneio itens"
  ON public.compras_starcolor_romaneio_itens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete romaneio itens"
  ON public.compras_starcolor_romaneio_itens FOR DELETE TO authenticated USING (true);
