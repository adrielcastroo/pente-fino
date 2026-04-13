-- Create table for exited items
CREATE TABLE public.estoque_saidas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registro_id UUID,
    item TEXT,
    proc TEXT,
    m2 NUMERIC,
    largura NUMERIC,
    m_linear NUMERIC,
    lote TEXT,
    endereco TEXT,
    lote_sistema TEXT,
    estrutura TEXT,
    coluna TEXT,
    nivel INTEGER,
    posicao INTEGER,
    conferente_entrada TEXT,
    conferente_saida TEXT,
    data_registro TIMESTAMP WITH TIME ZONE,
    data_saida TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add conferente_entrada to estoque_posicoes
ALTER TABLE public.estoque_posicoes ADD COLUMN conferente_entrada TEXT;

-- Enable RLS
ALTER TABLE public.estoque_saidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_posicoes ENABLE ROW LEVEL SECURITY;

-- Create policies for estoque_saidas
CREATE POLICY "Allow all access to estoque_saidas" ON public.estoque_saidas FOR ALL USING (true) WITH CHECK (true);

-- Ensure policies exist for estoque_posicoes (adding for safety if not present)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'estoque_posicoes' AND policyname = 'Allow all access to estoque_posicoes'
    ) THEN
        CREATE POLICY "Allow all access to estoque_posicoes" ON public.estoque_posicoes FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
