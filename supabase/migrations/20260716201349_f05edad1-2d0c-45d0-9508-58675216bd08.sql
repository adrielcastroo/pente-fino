CREATE POLICY "auge_depositos admin write"
ON public.auge_depositos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));