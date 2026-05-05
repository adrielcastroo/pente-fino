-- Create the reservas table
CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL,
    descricao TEXT,
    endereco TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    caixa_num TEXT,
    quantidade_cx INTEGER,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Create policies (Allowing all for now as per current local behavior, but restricted to authenticated if needed)
-- Since the user said "visible for all users", we enable shared access.
CREATE POLICY "Enable all for all users" ON public.reservas
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reservas_created_at ON public.reservas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservas_codigo ON public.reservas (codigo);