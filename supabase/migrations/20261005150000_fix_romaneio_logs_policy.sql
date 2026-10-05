-- Correção de políticas RLS para romaneio_automatico_logs
-- Tabela já existe, apenas adicionar/atualizar políticas

-- Dropar políticas existentes se houver conflito
DO $$
BEGIN
    -- Remover políticas antigas para recriar
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'romaneio_automatico_logs' AND policyname = 'romaneio_logs_insert') THEN
        DROP POLICY "romaneio_logs_insert" ON public.romaneio_automatico_logs;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'romaneio_automatico_logs' AND policyname = 'romaneio_logs_select') THEN
        DROP POLICY "romaneio_logs_select" ON public.romaneio_automatico_logs;
    END IF;
END $$;

-- Criar política de INSERT para authenticated
CREATE POLICY "romaneio_logs_insert" ON public.romaneio_automatico_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Criar política de SELECT para authenticated
CREATE POLICY "romaneio_logs_select" ON public.romaneio_automatico_logs
    FOR SELECT TO authenticated USING (true);
