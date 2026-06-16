GRANT INSERT, UPDATE ON public.estoque_posicoes TO anon;
GRANT UPDATE ON public.registros TO anon;

CREATE POLICY "Anyone can insert estoque_posicoes"
ON public.estoque_posicoes FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anyone can update estoque_posicoes"
ON public.estoque_posicoes FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can update registros"
ON public.registros FOR UPDATE TO anon USING (true) WITH CHECK (true);