
-- Create estoque_posicoes table
CREATE TABLE public.estoque_posicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estrutura TEXT NOT NULL,
  coluna TEXT NOT NULL,
  nivel INTEGER NOT NULL,
  posicao INTEGER NOT NULL CHECK (posicao >= 1 AND posicao <= 30),
  status TEXT NOT NULL DEFAULT 'livre',
  registro_id UUID REFERENCES public.registros(id) ON DELETE SET NULL,
  item TEXT DEFAULT '',
  proc TEXT DEFAULT '',
  m2 NUMERIC DEFAULT 0,
  largura NUMERIC DEFAULT 0,
  m_linear NUMERIC DEFAULT 0,
  lote TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  lote_sistema TEXT DEFAULT '',
  conferente_saida TEXT DEFAULT '',
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_saida TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (estrutura, coluna, nivel, posicao)
);

-- Enable RLS
ALTER TABLE public.estoque_posicoes ENABLE ROW LEVEL SECURITY;

-- Public RLS policies (same pattern as other tables)
CREATE POLICY "Public read estoque" ON public.estoque_posicoes FOR SELECT USING (true);
CREATE POLICY "Public insert estoque" ON public.estoque_posicoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update estoque" ON public.estoque_posicoes FOR UPDATE USING (id IS NOT NULL);
CREATE POLICY "Public delete estoque" ON public.estoque_posicoes FOR DELETE USING (id IS NOT NULL);

-- Indexes
CREATE INDEX idx_estoque_estrutura ON public.estoque_posicoes(estrutura);
CREATE INDEX idx_estoque_status ON public.estoque_posicoes(status);
CREATE INDEX idx_estoque_item ON public.estoque_posicoes(item);
