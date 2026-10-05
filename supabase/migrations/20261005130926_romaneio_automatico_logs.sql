-- Tabela de logs de romaneio (importação manual e automática)
-- Esta migração cobre: romaneio_automatico_logs, FK entre romaneio_dias e romaneio_linhas

-- 1. Cria tabela romaneio_automatico_logs se não existir
CREATE TABLE IF NOT EXISTS public.romaneio_automatico_logs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em         timestamptz NOT NULL DEFAULT now(),
    referencia        text,
    total_linhas      integer NOT NULL DEFAULT 0,
    rows              jsonb DEFAULT '[]'::jsonb,
    origem            text NOT NULL DEFAULT 'automatico',
    status            text NOT NULL DEFAULT 'arquivado',
    observacao        text
);

-- Grant + RLS
GRANT SELECT, INSERT ON public.romaneio_automatico_logs TO authenticated;
GRANT ALL ON public.romaneio_automatico_logs TO service_role;
ALTER TABLE public.romaneio_automatico_logs ENABLE ROW LEVEL SECURITY;

-- Recria policies apenas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'romaneio_automatico_logs'
        AND policyname = 'romaneio_logs_select'
    ) THEN
        CREATE POLICY "romaneio_logs_select" ON public.romaneio_automatico_logs
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'romaneio_automatico_logs'
        AND policyname = 'romaneio_logs_insert'
    ) THEN
        CREATE POLICY "romaneio_logs_insert" ON public.romaneio_automatico_logs
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END $$;

COMMENT ON TABLE public.romaneio_automatico_logs IS 'Logs de importação/arquivamento de romaneios (manual e automático)';

-- 2. Adiciona foreign key entre romaneio_dias e romaneio_linhas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_romaneio_linhas_romaneio'
    ) THEN
        ALTER TABLE public.romaneio_linhas
            ADD CONSTRAINT fk_romaneio_linhas_romaneio
            FOREIGN KEY (romaneio_id) REFERENCES public.romaneio_dias(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Cria view auxiliar para facilitar consultas
CREATE OR REPLACE VIEW public.romaneio_dias_linhas AS
SELECT
    d.id,
    d.data_romaneio,
    d.titulo,
    d.status,
    d.criado_em,
    l.id as linha_id,
    l.codigo_cliente,
    l.nome_cliente,
    l.quantidade,
    l.modalidade_frete,
    l.transportadora,
    l.observacoes
FROM public.romaneio_dias d
LEFT JOIN public.romaneio_linhas l ON l.romaneio_id = d.id;

-- Grant na view
GRANT SELECT ON public.romaneio_dias_linhas TO authenticated;