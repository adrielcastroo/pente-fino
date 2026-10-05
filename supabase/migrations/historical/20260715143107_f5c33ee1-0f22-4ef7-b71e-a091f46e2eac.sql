GRANT DELETE ON public.etiqueta_historico TO authenticated;
CREATE POLICY "etiqueta_historico_delete_supervisor" ON public.etiqueta_historico
  FOR DELETE TO authenticated
  USING (public.is_at_least('supervisor'::public.app_role));