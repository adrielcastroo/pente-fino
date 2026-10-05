-- Criar tabela de movimentações de endereço
CREATE TABLE IF NOT EXISTS public.movimentacoes_endereco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID, -- Opcional, dependendo da fonte (registros ou inventory)
    codigo_lote TEXT NOT NULL,
    endereco_anterior TEXT,
    endereco_novo TEXT NOT NULL,
    conferente_nome TEXT NOT NULL,
    data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Garantir permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_endereco TO authenticated;
GRANT ALL ON public.movimentacoes_endereco TO service_role;

-- Ativar RLS
ALTER TABLE public.movimentacoes_endereco ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.movimentacoes_endereco FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserção para usuários autenticados" ON public.movimentacoes_endereco FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir modificação para usuários autenticados" ON public.movimentacoes_endereco FOR ALL TO authenticated USING (true) WITH CHECK (true);