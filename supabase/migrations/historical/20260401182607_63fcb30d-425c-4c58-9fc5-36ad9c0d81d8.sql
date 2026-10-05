DROP POLICY IF EXISTS "Public insert conferences" ON public.conferences;
DROP POLICY IF EXISTS "Public update conferences" ON public.conferences;
DROP POLICY IF EXISTS "Public delete conferences" ON public.conferences;
DROP POLICY IF EXISTS "Public insert registros" ON public.registros;
DROP POLICY IF EXISTS "Public update registros" ON public.registros;
DROP POLICY IF EXISTS "Public delete registros" ON public.registros;

CREATE POLICY "Public insert conferences"
ON public.conferences
FOR INSERT
TO public
WITH CHECK (btrim(processo) <> '' AND conferente IS NOT NULL);

CREATE POLICY "Public update conferences"
ON public.conferences
FOR UPDATE
TO public
USING (id IS NOT NULL)
WITH CHECK (btrim(processo) <> '' AND conferente IS NOT NULL);

CREATE POLICY "Public delete conferences"
ON public.conferences
FOR DELETE
TO public
USING (id IS NOT NULL);

CREATE POLICY "Public insert registros"
ON public.registros
FOR INSERT
TO public
WITH CHECK (btrim(item) <> '' AND conference_id IS NOT NULL);

CREATE POLICY "Public update registros"
ON public.registros
FOR UPDATE
TO public
USING (id IS NOT NULL)
WITH CHECK (btrim(item) <> '');

CREATE POLICY "Public delete registros"
ON public.registros
FOR DELETE
TO public
USING (id IS NOT NULL);