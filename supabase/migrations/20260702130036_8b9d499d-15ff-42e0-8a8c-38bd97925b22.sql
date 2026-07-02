
CREATE TABLE IF NOT EXISTS public.nfe_entrada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave_acesso TEXT NOT NULL UNIQUE,
  numero TEXT,
  serie TEXT,
  cnpj_emitente TEXT,
  nome_emitente TEXT,
  data_emissao TIMESTAMPTZ,
  valor_total NUMERIC(14,2),
  situacao_manifestacao TEXT CHECK (situacao_manifestacao IN ('pendente','ciencia','confirmada','desconhecida','nao_realizada')) DEFAULT 'pendente',
  manifestada_at TIMESTAMPTZ,
  manifestada_por UUID REFERENCES auth.users(id),
  protocolo_manifestacao TEXT,
  xml_path TEXT,
  danfe_path TEXT,
  origem TEXT DEFAULT 'dfe',
  nsu TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfe_entrada TO authenticated;
GRANT ALL ON public.nfe_entrada TO service_role;
ALTER TABLE public.nfe_entrada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expedicao lê nfe_entrada" ON public.nfe_entrada
  FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao insere nfe_entrada" ON public.nfe_entrada
  FOR INSERT TO authenticated WITH CHECK (public.has_module('expedicao'));
CREATE POLICY "expedicao atualiza nfe_entrada" ON public.nfe_entrada
  FOR UPDATE TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao apaga nfe_entrada" ON public.nfe_entrada
  FOR DELETE TO authenticated USING (public.expedicao_has_at_least('gerente'));

CREATE TRIGGER trg_nfe_entrada_updated
  BEFORE UPDATE ON public.nfe_entrada
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_nfe_entrada_situacao ON public.nfe_entrada(situacao_manifestacao);
CREATE INDEX IF NOT EXISTS idx_nfe_entrada_emissao ON public.nfe_entrada(data_emissao DESC);

CREATE TABLE IF NOT EXISTS public.nfe_entrada_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_entrada_id UUID NOT NULL REFERENCES public.nfe_entrada(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.nfe_entrada_eventos TO authenticated;
GRANT ALL ON public.nfe_entrada_eventos TO service_role;
ALTER TABLE public.nfe_entrada_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expedicao lê nfe_entrada_eventos" ON public.nfe_entrada_eventos
  FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao insere nfe_entrada_eventos" ON public.nfe_entrada_eventos
  FOR INSERT TO authenticated WITH CHECK (public.has_module('expedicao'));

CREATE INDEX IF NOT EXISTS idx_nfe_entrada_eventos_nfe ON public.nfe_entrada_eventos(nfe_entrada_id, created_at DESC);
