-- Tabela de logs de romaneio (para importação manual e automática)
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

CREATE POLICY "romaneio_logs_select" ON public.romaneio_automatico_logs
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "romaneio_logs_insert" ON public.romaneio_automatico_logs
    FOR INSERT TO authenticated WITH CHECK (true);

COMMENT ON TABLE public.romaneio_automatico_logs IS 'Logs de importação/arquivamento de romaneios (manual e automático)';
