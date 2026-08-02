DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compras_modulo') THEN
    CREATE TYPE public.compras_modulo AS ENUM ('geral', 'rma', 'starcolor', 'entrega_apos');
  END IF;
END $$;

ALTER TABLE public.compras_pedidos ADD COLUMN IF NOT EXISTS modulo public.compras_modulo DEFAULT 'geral';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_pedidos TO authenticated;
GRANT ALL ON public.compras_pedidos TO service_role;
