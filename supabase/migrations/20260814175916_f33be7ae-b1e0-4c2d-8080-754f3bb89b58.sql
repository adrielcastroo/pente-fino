-- 1. Tabela de Transportadoras (caso não exista, necessária para o vínculo)
CREATE TABLE IF NOT EXISTS public.expedicao_transportadoras (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    nome text NOT NULL,
    status text DEFAULT 'ativo',
    created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.expedicao_transportadoras TO authenticated;
GRANT ALL ON public.expedicao_transportadoras TO service_role;
ALTER TABLE public.expedicao_transportadoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de transportadoras" ON public.expedicao_transportadoras FOR SELECT TO authenticated USING (true);

-- 2. Garantir que auge_clientes existe para a FK do plano anterior
CREATE TABLE IF NOT EXISTS public.auge_clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_auge text UNIQUE NOT NULL,
    nome_razao text NOT NULL,
    cpf_cnpj text,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.auge_clientes TO authenticated;
GRANT ALL ON public.auge_clientes TO service_role;
ALTER TABLE public.auge_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de clientes mirror" ON public.auge_clientes FOR SELECT TO authenticated USING (true);

-- 3. Evolução de Carrinhos e Romaneios com tratamento de tipos existentes
DO $$
BEGIN
    -- Carrinhos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expedicao_carrinhos' AND column_name='transportadora_id') THEN
        ALTER TABLE public.expedicao_carrinhos ADD COLUMN transportadora_id uuid REFERENCES public.expedicao_transportadoras(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expedicao_carrinhos' AND column_name='ciclo_id') THEN
        ALTER TABLE public.expedicao_carrinhos ADD COLUMN ciclo_id text;
    END IF;

    -- Romaneios (Adicionando colunas de controle operacional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expedicao_romaneios' AND column_name='operador_abertura_id') THEN
        ALTER TABLE public.expedicao_romaneios ADD COLUMN operador_abertura_id uuid REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expedicao_romaneios' AND column_name='operador_fechamento_id') THEN
        ALTER TABLE public.expedicao_romaneios ADD COLUMN operador_fechamento_id uuid REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expedicao_romaneios' AND column_name='ciclo_id') THEN
        ALTER TABLE public.expedicao_romaneios ADD COLUMN ciclo_id text;
    END IF;
END $$;

-- 4. Tabela de Alocações (Atomicidade)
CREATE TABLE IF NOT EXISTS public.expedicao_alocacoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    peca_id uuid REFERENCES public.expedicao_pecas(id) NOT NULL,
    carrinho_id uuid REFERENCES public.expedicao_carrinhos(id) NOT NULL,
    transportadora_id uuid REFERENCES public.expedicao_transportadoras(id) NOT NULL,
    romaneio_id uuid REFERENCES public.expedicao_romaneios(id),
    operador_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(peca_id)
);

GRANT SELECT, INSERT ON public.expedicao_alocacoes TO authenticated;
GRANT ALL ON public.expedicao_alocacoes TO service_role;
ALTER TABLE public.expedicao_alocacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operadores podem gerenciar alocacoes" ON public.expedicao_alocacoes FOR ALL TO authenticated USING (true);

-- 5. Tabela de Itens de Romaneio com log de auditoria
CREATE TABLE IF NOT EXISTS public.expedicao_romaneio_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    romaneio_id uuid REFERENCES public.expedicao_romaneios(id) ON DELETE CASCADE NOT NULL,
    peca_id uuid REFERENCES public.expedicao_pecas(id) NOT NULL,
    alocacao_id uuid REFERENCES public.expedicao_alocacoes(id) NOT NULL,
    cliente_id uuid REFERENCES public.auge_clientes(id),
    status text DEFAULT 'normal',
    operador_inclusao_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(peca_id, romaneio_id)
);

GRANT SELECT, INSERT, UPDATE ON public.expedicao_romaneio_itens TO authenticated;
GRANT ALL ON public.expedicao_romaneio_itens TO service_role;
ALTER TABLE public.expedicao_romaneio_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operadores podem gerenciar itens de romaneio" ON public.expedicao_romaneio_itens FOR ALL TO authenticated USING (true);
