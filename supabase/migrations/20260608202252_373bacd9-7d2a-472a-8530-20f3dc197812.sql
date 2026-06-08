-- Adicionar colunas às tabelas existentes
ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS curva_abc TEXT DEFAULT 'C' CHECK (curva_abc IN ('A', 'B', 'C'));
ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS ultima_contagem TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS curva_abc TEXT DEFAULT 'C' CHECK (curva_abc IN ('A', 'B', 'C'));
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS ultima_contagem TIMESTAMP WITH TIME ZONE;

-- Criar tabela de configurações de inventário
CREATE TABLE IF NOT EXISTS public.configuracoes_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curva TEXT UNIQUE NOT NULL CHECK (curva IN ('A', 'B', 'C')),
    dias_frequencia INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Garantir permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_inventario TO authenticated;
GRANT ALL ON public.configuracoes_inventario TO service_role;

-- Ativar RLS
ALTER TABLE public.configuracoes_inventario ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.configuracoes_inventario FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir modificação para usuários autenticados" ON public.configuracoes_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserir valores padrão
INSERT INTO public.configuracoes_inventario (curva, dias_frequencia)
VALUES 
    ('A', 30),
    ('B', 60),
    ('C', 90)
ON CONFLICT (curva) DO NOTHING;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_configuracoes_inventario_updated_at
BEFORE UPDATE ON public.configuracoes_inventario
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();