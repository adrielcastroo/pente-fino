
CREATE TABLE public.llm_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_provider TEXT NOT NULL DEFAULT 'cerebras' CHECK (active_provider IN ('cerebras','groq','nvidia','lovable')),
  cerebras_model TEXT,
  cerebras_fast_model TEXT,
  groq_model TEXT,
  groq_fast_model TEXT,
  nvidia_model TEXT,
  nvidia_fast_model TEXT,
  lovable_model TEXT,
  lovable_fast_model TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT SELECT ON public.llm_settings TO authenticated;
GRANT ALL ON public.llm_settings TO service_role;
ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read llm_settings" ON public.llm_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update llm_settings" ON public.llm_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.llm_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
