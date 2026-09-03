-- ============================================================
-- MIGRATION: Faturamento de Clientes - Regras de Frete
-- Aplicar: supabase db push
-- ============================================================

-- 1. Tabela de Regras de Faturamento
CREATE TABLE IF NOT EXISTS public.faturamento_regras (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_cliente    text UNIQUE NOT NULL,
    nome_cliente      text NOT NULL,
    
    -- Modalidade de frete
    modalidade_frete  text NOT NULL DEFAULT 'CIF',
    valor_minimo_frete numeric,
    
    -- Transportadoras
    transportadora_cif text,
    transportadora_fob text,
    
    -- Frequência e grupo
    frequencia_envio  text,
    grupo_economico   text,
    
    -- Status
    status            text NOT NULL DEFAULT 'ativo',
    condicao_pagamento text,
    limite_credito    numeric,
    
    -- Dados brutos
    observacoes       text,
    dados_extra       jsonb DEFAULT '{}'::jsonb,
    
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_faturamento_regras_codigo ON public.faturamento_regras(codigo_cliente);
CREATE INDEX IF NOT EXISTS idx_faturamento_regras_status ON public.faturamento_regras(status);
CREATE INDEX IF NOT EXISTS idx_faturamento_regras_modalidade ON public.faturamento_regras(modalidade_frete);
CREATE INDEX IF NOT EXISTS idx_faturamento_regras_grupo ON public.faturamento_regras(grupo_economico);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faturamento_regras TO authenticated;
GRANT ALL ON public.faturamento_regras TO service_role;
ALTER TABLE public.faturamento_regras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faturamento_regras_select" ON public.faturamento_regras
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "faturamento_regras_insert" ON public.faturamento_regras
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "faturamento_regras_update" ON public.faturamento_regras
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "faturamento_regras_delete" ON public.faturamento_regras
    FOR DELETE TO authenticated USING (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public._trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_faturamento_regras_updated_at ON public.faturamento_regras;
CREATE TRIGGER trg_faturamento_regras_updated_at
    BEFORE UPDATE ON public.faturamento_regras
    FOR EACH ROW EXECUTE FUNCTION public._trigger_set_updated_at();

-- 2. Tabela de Logs de Romaneio
CREATE TABLE IF NOT EXISTS public.romaneio_automatico_logs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em         timestamptz NOT NULL DEFAULT now(),
    data_faturamento  date NOT NULL,
    status            text NOT NULL DEFAULT 'gerado',
    total_linhas      integer NOT NULL DEFAULT 0,
    transportadora_id text,
    transportadora_nome text,
    json_detalhes     jsonb DEFAULT '[]'::jsonb,
    usuario_id        uuid REFERENCES auth.users(id),
    observacao        text
);

-- Grants
GRANT SELECT ON public.romaneio_automatico_logs TO authenticated;
GRANT ALL ON public.romaneio_automatico_logs TO service_role;
ALTER TABLE public.romaneio_automatico_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "romaneio_logs_select" ON public.romaneio_automatico_logs
    FOR SELECT TO authenticated USING (true);

-- 3. Seed inicial (opcional - dados de teste)
-- Descomente abaixo para popular com dados da planilha
/*
INSERT INTO public.faturamento_regras (codigo_cliente, nome_cliente, modalidade_frete, valor_minimo_frete, transportadora_cif, transportadora_fob, status)
VALUES
    ('C1739', 'Monter Automação e Decoração Ltda', 'CIF_FOB', 0, 'Expresso São Miguel', 'Rodonaves', 'ativo'),
    ('C1501', 'Morada Design Cortinas e Persianas Ltda', 'CIF_FOB', 0, 'Rodonaves', 'Rodonaves', 'ativo'),
    ('C0033', 'Cortikasa Cortinas e Persianas LTDA ME', 'FOB_SEMPRE', NULL, NULL, 'Aceville', 'ativo'),
    ('C0947', 'MRS Acabamentos e Decorações Ltda', 'FOB', NULL, NULL, 'MHR Express', 'ativo'),
    ('C0573', '3A Acabamentos e Decorações Ltda', 'CIF_FOB', 700, 'Jamef', 'Bauer', 'inativado');
*/
