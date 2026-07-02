
CREATE POLICY "nfe-arquivos select expedicao"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'nfe-arquivos' AND public.has_module('expedicao'));

CREATE POLICY "nfe-arquivos insert expedicao"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'nfe-arquivos' AND public.has_module('expedicao'));

CREATE POLICY "nfe-arquivos update expedicao"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'nfe-arquivos' AND public.has_module('expedicao'));

CREATE POLICY "nfe-arquivos delete expedicao"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'nfe-arquivos' AND public.has_module('expedicao'));
