-- Adicionar colunas às tabelas existentes (repetido para garantir idempotência se a anterior falhou em algum ponto)
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

-- Políticas RLS (Corrigidas para não usar USING true em escrita sem CHECK)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir leitura para usuários autenticados' AND tablename = 'configuracoes_inventario') THEN
        CREATE POLICY "Permitir leitura para usuários autenticados" ON public.configuracoes_inventario FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir inserção para usuários autenticados' AND tablename = 'configuracoes_inventario') THEN
        CREATE POLICY "Permitir inserção para usuários autenticados" ON public.configuracoes_inventario FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir atualização para usuários autenticados' AND tablename = 'configuracoes_inventario') THEN
        CREATE POLICY "Permitir atualização para usuários autenticados" ON public.configuracoes_inventario FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Inserir valores padrão
INSERT INTO public.configuracoes_inventario (curva, dias_frequencia)
VALUES 
    ('A', 30),
    ('B', 60),
    ('C', 90)
ON CONFLICT (curva) DO NOTHING;

-- Função genérica para update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_configuracoes_inventario_updated_at ON public.configuracoes_inventario;
CREATE TRIGGER update_configuracoes_inventario_updated_at
BEFORE UPDATE ON public.configuracoes_inventario
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();