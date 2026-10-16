-- SEC-005: Restringir SELECT universal na tabela profiles
-- Antes: qualquer autenticado podia ver todos os perfis
-- Depois: self ou admin
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Profiles viewable by self and admin') THEN
    DROP POLICY "Profiles viewable by self and admin" ON public.profiles;
  END IF;
END $$;
CREATE POLICY "Profiles viewable by self and admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
  );
