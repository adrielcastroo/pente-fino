GRANT INSERT ON public.conferences TO anon;
GRANT INSERT ON public.registros TO anon;

CREATE POLICY "Anyone can insert conferences"
ON public.conferences FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anyone can insert registros"
ON public.registros FOR INSERT TO anon WITH CHECK (true);