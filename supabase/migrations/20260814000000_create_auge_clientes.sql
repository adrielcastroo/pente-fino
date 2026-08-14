CREATE TABLE IF NOT EXISTS public.auge_clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    nome text,
    nome_fantasia text,
    razao_social text,
    cpf_cnpj text,
    email text,
    telefone text,
    celular text,
    endereco text,
    numero text,
    complemento text,
    bairro text,
    cidade text,
    uf text,
    cep text,
    situacao text,
    raw jsonb,
    synced_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Grant privileges: Somente leitura para usuários autenticados, total para service_role
GRANT SELECT ON public.auge_clientes TO authenticated;
GRANT ALL ON public.auge_clientes TO service_role;

-- Enable RLS
ALTER TABLE public.auge_clientes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.auge_clientes
    FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auge_clientes_codigo ON public.auge_clientes (codigo);
CREATE INDEX IF NOT EXISTS idx_auge_clientes_cpf_cnpj ON public.auge_clientes (cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_auge_clientes_nome ON public.auge_clientes (nome);
