CREATE TABLE public.tarefas_contagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID,
  item_name TEXT,
  codigo_lote TEXT NOT NULL,
  quantidade_esperada_sistema NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.historico_contagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID REFERENCES public.tarefas_contagem(id) ON DELETE CASCADE,
  conferente_nome TEXT,
  quantidade_contada NUMERIC NOT NULL,
  quantidade_sistema NUMERIC NOT NULL DEFAULT 0,
  data_conferencia TIMESTAMP WITH TIME ZONE DEFAULT now(),
  diferenca NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT ALL ON public.tarefas_contagem TO authenticated;
GRANT ALL ON public.tarefas_contagem TO anon;
GRANT ALL ON public.tarefas_contagem TO service_role;

GRANT ALL ON public.historico_contagens TO authenticated;
GRANT ALL ON public.historico_contagens TO anon;
GRANT ALL ON public.historico_contagens TO service_role;

ALTER TABLE public.tarefas_contagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_contagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on tarefas_contagem" ON public.tarefas_contagem FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users on historico_contagens" ON public.historico_contagens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon users on tarefas_contagem" ON public.tarefas_contagem FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon users on historico_contagens" ON public.historico_contagens FOR ALL TO anon USING (true) WITH CHECK (true);

-- Mock data for testing
INSERT INTO public.tarefas_contagem (item_name, codigo_lote, quantidade_esperada_sistema, status)
VALUES 
('Tecido Algodão Premium', 'LOTE-123', 50.5, 'pendente'),
('Motor Elétrico Trifásico', 'MOT-998', 12, 'pendente');
