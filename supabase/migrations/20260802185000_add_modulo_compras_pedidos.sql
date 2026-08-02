DO $$ BEGIN
  CREATE TYPE public.compras_modulo AS ENUM ('geral', 'rma', 'starcolor', 'entrega_apos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.compras_pedidos ADD COLUMN IF NOT EXISTS modulo public.compras_modulo DEFAULT 'geral';

-- Atualiza a política de inserção para garantir que o campo modulo seja aceito
-- (Já está liberado pelo WITH CHECK (true), mas as permissões de Data API precisam ser atualizadas se houver cache)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_pedidos TO authenticated;
