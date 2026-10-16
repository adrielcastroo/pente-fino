-- SEC-009: Migrar auth.role() depreciado para auth.jwt()->>'role'
-- Estas funções já foram aplicadas historicamente; esta migração atualiza
-- os polÃ­ticas que usam auth.role() para usar a forma nÃ£o depreciada.

-- 20260416122040 policies
DO $$
BEGIN
  -- registros
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'registros' AND policyname = 'Authenticated users can delete registros') THEN
    DROP POLICY "Authenticated users can delete registros" ON public.registros;
    CREATE POLICY "Authenticated users can delete registros" ON public.registros
      FOR DELETE USING (auth.jwt()->>'role' = 'authenticated');
  END IF;

  -- conferences
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conferences' AND policyname = 'Authenticated users can delete conferences') THEN
    DROP POLICY "Authenticated users can delete conferences" ON public.conferences;
    CREATE POLICY "Authenticated users can delete conferences" ON public.conferences
      FOR DELETE USING (auth.jwt()->>'role' = 'authenticated');
  END IF;

  -- estoque_posicoes
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estoque_posicoes' AND policyname = 'Authenticated users can delete estoque') THEN
    DROP POLICY "Authenticated users can delete estoque" ON public.estoque_posicoes;
    CREATE POLICY "Authenticated users can delete estoque" ON public.estoque_posicoes
      FOR DELETE USING (auth.jwt()->>'role' = 'authenticated');
  END IF;

  -- estoque_saidas
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estoque_saidas' AND policyname = 'Authenticated users can delete estoque_saidas') THEN
    DROP POLICY "Authenticated users can delete estoque_saidas" ON public.estoque_saidas;
    CREATE POLICY "Authenticated users can delete estoque_saidas" ON public.estoque_saidas
      FOR DELETE USING (auth.jwt()->>'role' = 'authenticated');
  END IF;

  -- inventory
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Authenticated users can delete inventory') THEN
    DROP POLICY "Authenticated users can delete inventory" ON public.inventory;
    CREATE POLICY "Authenticated users can delete inventory" ON public.inventory
      FOR DELETE USING (auth.jwt()->>'role' = 'authenticated');
  END IF;
END
$$;

-- 20260417110627 policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'report_logs' AND policyname = 'Users can view report logs') THEN
    DROP POLICY "Users can view report logs" ON public.report_logs;
    CREATE POLICY "Users can view report logs" ON public.report_logs
      FOR SELECT USING (auth.jwt()->>'role' = 'authenticated');
  END IF;
END
$$;
