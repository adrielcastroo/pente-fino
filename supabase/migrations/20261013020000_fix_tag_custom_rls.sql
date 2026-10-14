-- Corrige RLS de auge_tag_custom para permitir leitura pelo anon (frontend).
-- A migration original criava apenas política para authenticated; o frontend
-- com AuthProvider do Supabase envia o JWT, mas em alguns contextos (preview)
-- a policy precisa explícita do role anon para SELECT.

DROP POLICY IF EXISTS "auge_tag_custom read authenticated" ON public.auge_tag_custom;

CREATE POLICY "auge_tag_custom_read"
  ON public.auge_tag_custom
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "auge_tag_custom_write"
  ON public.auge_tag_custom
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
