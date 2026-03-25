
-- Create conferences table
CREATE TABLE public.conferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo TEXT NOT NULL,
  conferente TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registros table
CREATE TABLE public.registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id UUID REFERENCES public.conferences(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  m2 NUMERIC NOT NULL DEFAULT 0,
  m_linear NUMERIC NOT NULL DEFAULT 0,
  largura NUMERIC NOT NULL DEFAULT 0,
  endereco TEXT NOT NULL DEFAULT '',
  lote TEXT NOT NULL DEFAULT '',
  lote_sistema TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required, shared database)
CREATE POLICY "Public read conferences" ON public.conferences FOR SELECT USING (true);
CREATE POLICY "Public insert conferences" ON public.conferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update conferences" ON public.conferences FOR UPDATE USING (true);
CREATE POLICY "Public delete conferences" ON public.conferences FOR DELETE USING (true);

CREATE POLICY "Public read registros" ON public.registros FOR SELECT USING (true);
CREATE POLICY "Public insert registros" ON public.registros FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update registros" ON public.registros FOR UPDATE USING (true);
CREATE POLICY "Public delete registros" ON public.registros FOR DELETE USING (true);

-- Index for faster queries
CREATE INDEX idx_registros_conference ON public.registros(conference_id);
