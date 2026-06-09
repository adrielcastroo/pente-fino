-- Add missing columns to existing tables
ALTER TABLE IF EXISTS public.tarefas_contagem ADD COLUMN IF NOT EXISTS has_lote BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.tarefas_contagem ADD COLUMN IF NOT EXISTS conferente_id UUID REFERENCES auth.users(id);

-- Create table for daily limits tracking
CREATE TABLE IF NOT EXISTS public.contagens_diarias_limite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    contagens_com_lote INTEGER DEFAULT 0,
    contagens_sem_lote INTEGER DEFAULT 0,
    UNIQUE(user_id, data)
);

-- Create table for detailed bips during a task
CREATE TABLE IF NOT EXISTS public.contagem_itens_bipados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarefa_id UUID REFERENCES public.tarefas_contagem(id) ON DELETE CASCADE,
    lote TEXT,
    quantidade NUMERIC,
    bipado_em TIMESTAMPTZ DEFAULT now()
);

-- Add data_entrada if not exists to track item arrival
ALTER TABLE IF EXISTS public.registros ADD COLUMN IF NOT EXISTS data_entrada TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.inventory ADD COLUMN IF NOT EXISTS data_entrada TIMESTAMPTZ DEFAULT now();

-- Ensure curves are present in configs if not already
INSERT INTO public.configuracoes_inventario (curva, dias_frequencia)
SELECT 'A', 15 WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_inventario WHERE curva = 'A');
INSERT INTO public.configuracoes_inventario (curva, dias_frequencia)
SELECT 'B', 30 WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_inventario WHERE curva = 'B');
INSERT INTO public.configuracoes_inventario (curva, dias_frequencia)
SELECT 'C', 60 WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_inventario WHERE curva = 'C');

-- Grants
GRANT ALL ON public.contagens_diarias_limite TO authenticated;
GRANT ALL ON public.contagens_diarias_limite TO service_role;
GRANT ALL ON public.contagem_itens_bipados TO authenticated;
GRANT ALL ON public.contagem_itens_bipados TO service_role;

-- RLS
ALTER TABLE public.contagens_diarias_limite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contagem_itens_bipados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to contagens_diarias_limite" ON public.contagens_diarias_limite FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to contagem_itens_bipados" ON public.contagem_itens_bipados FOR ALL TO authenticated USING (true);
