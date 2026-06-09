CREATE TABLE IF NOT EXISTS public.inventory_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curve_a_days INTEGER NOT NULL DEFAULT 15,
    curve_b_days INTEGER NOT NULL DEFAULT 30,
    curve_c_days INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID, -- References items or registers
    item_type TEXT NOT NULL, -- 'tecido' or 'inventory' (engine)
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'awaiting_recheck', 'completed'
    assigned_to UUID REFERENCES auth.users(id),
    completed_by UUID REFERENCES auth.users(id),
    scheduled_date DATE DEFAULT CURRENT_DATE,
    completed_at TIMESTAMPTZ,
    expected_qty NUMERIC,
    counted_qty NUMERIC,
    divergence_details JSONB,
    has_lote BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.inventory_tasks(id) ON DELETE CASCADE,
    lote TEXT,
    quantity NUMERIC,
    biped_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_daily_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    counts_with_lote INTEGER DEFAULT 0,
    counts_without_lote INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- Grants
GRANT ALL ON public.inventory_configs TO authenticated;
GRANT ALL ON public.inventory_configs TO service_role;
GRANT ALL ON public.inventory_tasks TO authenticated;
GRANT ALL ON public.inventory_tasks TO service_role;
GRANT ALL ON public.inventory_task_items TO authenticated;
GRANT ALL ON public.inventory_task_items TO service_role;
GRANT ALL ON public.inventory_daily_limits TO authenticated;
GRANT ALL ON public.inventory_daily_limits TO service_role;

-- RLS
ALTER TABLE public.inventory_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_daily_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to inventory_configs" ON public.inventory_configs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to inventory_tasks" ON public.inventory_tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to inventory_task_items" ON public.inventory_task_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access to inventory_daily_limits" ON public.inventory_daily_limits FOR ALL TO authenticated USING (true);

-- Default config
INSERT INTO public.inventory_configs (curve_a_days, curve_b_days, curve_c_days) 
VALUES (15, 30, 60)
ON CONFLICT DO NOTHING;