-- Forçar criação das políticas RLS para romaneio_automatico_logs
-- Executa SEMPRE, não importa se já existe ou não

DROP POLICY IF EXISTS "romaneio_logs_insert" ON public.romaneio_automatico_logs;
DROP POLICY IF EXISTS "romaneio_logs_select" ON public.romaneio_automatico_logs;

CREATE POLICY "romaneio_logs_insert" ON public.romaneio_automatico_logs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "romaneio_logs_select" ON public.romaneio_automatico_logs
    FOR SELECT TO authenticated USING (true);
