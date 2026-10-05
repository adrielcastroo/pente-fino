
-- Grants for anon
GRANT SELECT, INSERT, UPDATE ON public.conferences TO anon;
GRANT SELECT, INSERT, UPDATE ON public.registros TO anon;
GRANT SELECT, INSERT, UPDATE ON public.estoque_saidas TO anon;
GRANT SELECT, INSERT, UPDATE ON public.estoque_posicoes TO anon;

-- Ensure authenticated grants are explicit too
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_saidas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_posicoes TO authenticated;

-- Policies for anon on conferences
DROP POLICY IF EXISTS "Anon can read conferences" ON public.conferences;
CREATE POLICY "Anon can read conferences" ON public.conferences FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert conferences" ON public.conferences;
CREATE POLICY "Anon can insert conferences" ON public.conferences FOR INSERT TO anon WITH CHECK (created_by IS NULL);

DROP POLICY IF EXISTS "Anon can update conferences" ON public.conferences;
CREATE POLICY "Anon can update conferences" ON public.conferences FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Policies for anon on registros (insert/update already exist; add select)
DROP POLICY IF EXISTS "Anon can read registros" ON public.registros;
CREATE POLICY "Anon can read registros" ON public.registros FOR SELECT TO anon USING (true);

-- Policies for anon on estoque_saidas
DROP POLICY IF EXISTS "Anon can read estoque_saidas" ON public.estoque_saidas;
CREATE POLICY "Anon can read estoque_saidas" ON public.estoque_saidas FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert estoque_saidas" ON public.estoque_saidas;
CREATE POLICY "Anon can insert estoque_saidas" ON public.estoque_saidas FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update estoque_saidas" ON public.estoque_saidas;
CREATE POLICY "Anon can update estoque_saidas" ON public.estoque_saidas FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Policies for anon on estoque_posicoes
DROP POLICY IF EXISTS "Anon can read estoque_posicoes" ON public.estoque_posicoes;
CREATE POLICY "Anon can read estoque_posicoes" ON public.estoque_posicoes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon can insert estoque_posicoes" ON public.estoque_posicoes;
CREATE POLICY "Anon can insert estoque_posicoes" ON public.estoque_posicoes FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update estoque_posicoes" ON public.estoque_posicoes;
CREATE POLICY "Anon can update estoque_posicoes" ON public.estoque_posicoes FOR UPDATE TO anon USING (true) WITH CHECK (true);
