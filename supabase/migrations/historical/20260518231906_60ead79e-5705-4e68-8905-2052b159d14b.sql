-- Create independent reservations table
CREATE TABLE IF NOT EXISTS public.independent_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL,
    descricao TEXT,
    endereco TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    caixa_num TEXT,
    quantidade_cx INTEGER,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.independent_reservations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for authenticated users" 
ON public.independent_reservations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.independent_reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for search
CREATE INDEX idx_reservations_codigo ON public.independent_reservations(codigo);
CREATE INDEX idx_reservations_endereco ON public.independent_reservations(endereco);
