
-- itens_cadastro: leitura pública
DROP POLICY IF EXISTS "Authenticated users can view itens_cadastro" ON public.itens_cadastro;
CREATE POLICY "Anyone can view itens_cadastro"
  ON public.itens_cadastro FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.itens_cadastro TO anon;

-- reservas: leitura pública
DROP POLICY IF EXISTS "Authenticated users can view reservas" ON public.reservas;
DROP POLICY IF EXISTS "Users can view reservas" ON public.reservas;
DROP POLICY IF EXISTS "reservas_select" ON public.reservas;
CREATE POLICY "Anyone can view reservas"
  ON public.reservas FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.reservas TO anon;

-- independent_reservations: leitura pública
DROP POLICY IF EXISTS "Authenticated users can view independent_reservations" ON public.independent_reservations;
DROP POLICY IF EXISTS "Users can view independent_reservations" ON public.independent_reservations;
DROP POLICY IF EXISTS "independent_reservations_select" ON public.independent_reservations;
CREATE POLICY "Anyone can view independent_reservations"
  ON public.independent_reservations FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.independent_reservations TO anon;
