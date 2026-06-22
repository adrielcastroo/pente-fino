
-- Hierarchy helper
CREATE OR REPLACE FUNCTION public.is_at_least(_min public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranks AS (
    SELECT 'admin'::text AS r, 1 AS lvl
    UNION ALL SELECT 'gerente', 2
    UNION ALL SELECT 'supervisor', 3
    UNION ALL SELECT 'operador', 4
    UNION ALL SELECT 'user', 4
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN ranks my ON my.r = ur.role::text
    JOIN ranks need ON need.r = _min::text
    WHERE ur.user_id = auth.uid()
      AND my.lvl <= need.lvl
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_at_least(public.app_role) TO authenticated;

-- registros: tighten DELETE + UPDATE on old rows
DROP POLICY IF EXISTS "Authenticated can delete" ON public.registros;
DROP POLICY IF EXISTS "Authenticated can update" ON public.registros;
CREATE POLICY "Supervisor+ can delete registros"
  ON public.registros FOR DELETE TO authenticated
  USING (public.is_at_least('supervisor'::public.app_role));
CREATE POLICY "Authenticated can update recent registros"
  ON public.registros FOR UPDATE TO authenticated
  USING (
    public.is_at_least('supervisor'::public.app_role)
    OR created_at > now() - interval '24 hours'
  )
  WITH CHECK (true);

-- estoque_posicoes: DELETE supervisor+ (replaces admin-only — broader op need)
DROP POLICY IF EXISTS "Admin can delete estoque" ON public.estoque_posicoes;
CREATE POLICY "Supervisor+ can delete estoque"
  ON public.estoque_posicoes FOR DELETE TO authenticated
  USING (public.is_at_least('supervisor'::public.app_role));

-- estoque_saidas: DELETE supervisor+
DROP POLICY IF EXISTS "Authenticated can delete" ON public.estoque_saidas;
CREATE POLICY "Supervisor+ can delete estoque_saidas"
  ON public.estoque_saidas FOR DELETE TO authenticated
  USING (public.is_at_least('supervisor'::public.app_role));

-- Master data tables: INSERT/UPDATE/DELETE supervisor+
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'itens_cadastro','lotes_mestres','madeira_quadrantes',
    'report_settings','configuracoes_inventario'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can delete" ON public.%I', t);
    EXECUTE format($f$
      CREATE POLICY "Supervisor+ can insert %1$s"
        ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (public.is_at_least('supervisor'::public.app_role));
      CREATE POLICY "Supervisor+ can update %1$s"
        ON public.%1$I FOR UPDATE TO authenticated
        USING (public.is_at_least('supervisor'::public.app_role))
        WITH CHECK (public.is_at_least('supervisor'::public.app_role));
      CREATE POLICY "Supervisor+ can delete %1$s"
        ON public.%1$I FOR DELETE TO authenticated
        USING (public.is_at_least('supervisor'::public.app_role));
    $f$, t);
  END LOOP;
END $$;
