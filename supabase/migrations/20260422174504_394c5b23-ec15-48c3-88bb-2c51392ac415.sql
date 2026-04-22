CREATE TABLE public.madeira_quadrantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estrutura TEXT NOT NULL DEFAULT 'MAD01',
  coluna TEXT NOT NULL,
  nivel INTEGER NOT NULL,
  tipo_ocupacao TEXT NOT NULL DEFAULT 'lamina',
  capacidade INTEGER NOT NULL DEFAULT 24,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT madeira_quadrantes_unique UNIQUE (estrutura, coluna, nivel),
  CONSTRAINT madeira_quadrantes_tipo_check CHECK (tipo_ocupacao IN ('lamina', 'base'))
);

ALTER TABLE public.madeira_quadrantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read madeira quadrantes" ON public.madeira_quadrantes FOR SELECT USING (true);
CREATE POLICY "Public insert madeira quadrantes" ON public.madeira_quadrantes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update madeira quadrantes" ON public.madeira_quadrantes FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete madeira quadrantes" ON public.madeira_quadrantes FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX idx_madeira_quadrantes_estrutura ON public.madeira_quadrantes(estrutura, coluna, nivel);