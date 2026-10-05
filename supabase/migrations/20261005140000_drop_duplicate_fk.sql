-- Remover FK duplicada criada anteriormente
-- A FK correta é: romaneio_linhas_romaneio_id_fkey
-- A FK duplicada causava conflito no PostgREST

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_romaneio_linhas_romaneio') THEN
        ALTER TABLE public.romaneio_linhas DROP CONSTRAINT fk_romaneio_linhas_romaneio;
    END IF;
END $$;
