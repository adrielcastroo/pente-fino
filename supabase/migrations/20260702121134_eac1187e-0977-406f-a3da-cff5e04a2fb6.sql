
CREATE POLICY "comprov_objects_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'expedicao-comprovantes' AND public.has_module('expedicao'));

CREATE POLICY "comprov_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expedicao-comprovantes' AND public.expedicao_has_at_least('operador'));

CREATE POLICY "comprov_objects_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'expedicao-comprovantes' AND public.expedicao_has_at_least('supervisor'));
