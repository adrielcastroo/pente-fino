-- Corrige RLS de auge_tag_padrao para permitir leitura pelo anon (frontend).
-- A migration anterior criava apenas política para authenticated; o frontend
-- usa a key anon/publishable que precisava de permissão explícita de SELECT.

DROP POLICY IF EXISTS "auge_tag_padrao read authenticated" ON public.auge_tag_padrao;
DROP POLICY IF EXISTS "auge_tag_padrao write service" ON public.auge_tag_padrao;

CREATE POLICY "auge_tag_padrao read"
  ON public.auge_tag_padrao
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "auge_tag_padrao write"
  ON public.auge_tag_padrao
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
