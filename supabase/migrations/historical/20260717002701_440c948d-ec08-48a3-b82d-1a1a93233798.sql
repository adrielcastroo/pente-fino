
ALTER TABLE public.auge_produtos REPLICA IDENTITY FULL;
ALTER TABLE public.auge_produtos_saldo REPLICA IDENTITY FULL;
ALTER TABLE public.auge_sync_runs REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'auge_produtos') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.auge_produtos';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'auge_produtos_saldo') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.auge_produtos_saldo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'auge_sync_runs') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.auge_sync_runs';
  END IF;
END$$;
