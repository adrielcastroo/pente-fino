
-- 1) Drop dangerous public-role policies on estoque_saidas (allowed anonymous insert/update)
DROP POLICY IF EXISTS "Public insert estoque_saidas" ON public.estoque_saidas;
DROP POLICY IF EXISTS "Public update estoque_saidas" ON public.estoque_saidas;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_saidas" ON public.estoque_saidas;

-- 2) Drop duplicate policies on inventory (keep the "Authenticated can ..." set)
DROP POLICY IF EXISTS "Authenticated users can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON public.inventory;

-- 3) Replace every "Public read access" SELECT policy (anon+authenticated) with authenticated-only
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND cmd='SELECT'
      AND 'anon' = ANY(roles)
      AND qual = 'true'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    EXECUTE format(
      'CREATE POLICY "Authenticated read access" ON public.%I FOR SELECT TO authenticated USING (true)',
      r.tablename
    );
  END LOOP;
END $$;

-- 4) Revoke anon privileges on every public table (defense in depth — RLS is the primary control)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.tablename);
  END LOOP;
END $$;
