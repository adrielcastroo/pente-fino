-- Ensure base columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros' AND column_name = 'curva_abc') THEN
        ALTER TABLE public.registros ADD COLUMN curva_abc TEXT DEFAULT 'C';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros' AND column_name = 'ultima_contagem') THEN
        ALTER TABLE public.registros ADD COLUMN ultima_contagem TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros' AND column_name = 'data_entrada') THEN
        ALTER TABLE public.registros ADD COLUMN data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'curva_abc') THEN
        ALTER TABLE public.inventory ADD COLUMN curva_abc TEXT DEFAULT 'C';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'ultima_contagem') THEN
        ALTER TABLE public.inventory ADD COLUMN ultima_contagem TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'data_entrada') THEN
        ALTER TABLE public.inventory ADD COLUMN data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Drop old names if they exist to avoid confusion (safe check)
-- DROP TABLE IF EXISTS public.tarefas_contagem;
-- DROP TABLE IF EXISTS public.contagens_diarias_limite;
-- DROP TABLE IF EXISTS public.historico_contagens;

-- Ensure inventory_configs
CREATE TABLE IF NOT EXISTS public.inventory_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curve_a_days INTEGER DEFAULT 15,
    curve_b_days INTEGER DEFAULT 30,
    curve_c_days INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure inventory_tasks
CREATE TABLE IF NOT EXISTS public.inventory_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID, -- Reference to either registros or inventory
    item_type TEXT, -- 'registros' or 'inventory'
    item_name TEXT,
    codigo_lote TEXT,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'completed', 'awaiting_recheck'
    assigned_to UUID REFERENCES auth.users(id),
    completed_by UUID REFERENCES auth.users(id),
    conferente_nome TEXT, -- Display name fallback
    scheduled_date DATE DEFAULT CURRENT_DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expected_qty NUMERIC DEFAULT 0,
    counted_qty NUMERIC DEFAULT 0,
    divergence_details JSONB,
    has_lote BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure inventory_daily_limits
CREATE TABLE IF NOT EXISTS public.inventory_daily_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    date DATE DEFAULT CURRENT_DATE,
    counts_with_lote INTEGER DEFAULT 0,
    counts_without_lote INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- Ensure inventory_task_items (for individual bips)
CREATE TABLE IF NOT EXISTS public.inventory_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.inventory_tasks(id) ON DELETE CASCADE,
    lote TEXT,
    quantity NUMERIC DEFAULT 1,
    biped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_daily_limits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_task_items TO authenticated;
GRANT ALL ON public.inventory_configs TO service_role;
GRANT ALL ON public.inventory_tasks TO service_role;
GRANT ALL ON public.inventory_daily_limits TO service_role;
GRANT ALL ON public.inventory_task_items TO service_role;

-- Enable RLS
ALTER TABLE public.inventory_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_task_items ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public read for authenticated users" ON public.inventory_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Full access for authenticated users" ON public.inventory_tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for authenticated users" ON public.inventory_daily_limits FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for authenticated users" ON public.inventory_task_items FOR ALL TO authenticated USING (true);
