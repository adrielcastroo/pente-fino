
-- Fase 9: RLS por papel no módulo Expedição
-- Mantém leitura para qualquer usuário com módulo expedição.
-- Restringe escrita em cadastros (carrinhos/transportadoras) a supervisor+.
-- Restringe DELETE em pickings/itens a admin.

-- Helper: tem módulo + papel mínimo
CREATE OR REPLACE FUNCTION public.expedicao_has_at_least(_min app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_module('expedicao') AND public.is_at_least(_min);
$$;

-- ===== expedicao_transportadoras =====
DROP POLICY IF EXISTS expedicao_transp_write ON public.expedicao_transportadoras;
CREATE POLICY expedicao_transp_insert ON public.expedicao_transportadoras
  FOR INSERT TO authenticated
  WITH CHECK (public.expedicao_has_at_least('supervisor'::app_role));
CREATE POLICY expedicao_transp_update ON public.expedicao_transportadoras
  FOR UPDATE TO authenticated
  USING (public.expedicao_has_at_least('supervisor'::app_role))
  WITH CHECK (public.expedicao_has_at_least('supervisor'::app_role));
CREATE POLICY expedicao_transp_delete ON public.expedicao_transportadoras
  FOR DELETE TO authenticated
  USING (public.expedicao_has_at_least('admin'::app_role));

-- ===== expedicao_carrinhos =====
DROP POLICY IF EXISTS expedicao_carr_write ON public.expedicao_carrinhos;
CREATE POLICY expedicao_carr_insert ON public.expedicao_carrinhos
  FOR INSERT TO authenticated
  WITH CHECK (public.expedicao_has_at_least('supervisor'::app_role));
CREATE POLICY expedicao_carr_update ON public.expedicao_carrinhos
  FOR UPDATE TO authenticated
  USING (public.has_module('expedicao'))  -- operador pode marcar como em_uso/livre
  WITH CHECK (public.has_module('expedicao'));
CREATE POLICY expedicao_carr_delete ON public.expedicao_carrinhos
  FOR DELETE TO authenticated
  USING (public.expedicao_has_at_least('admin'::app_role));

-- ===== expedicao_pickings =====
DROP POLICY IF EXISTS expedicao_pk_write ON public.expedicao_pickings;
CREATE POLICY expedicao_pk_insert ON public.expedicao_pickings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_module('expedicao'));
CREATE POLICY expedicao_pk_update ON public.expedicao_pickings
  FOR UPDATE TO authenticated
  USING (public.has_module('expedicao'))
  WITH CHECK (public.has_module('expedicao'));
CREATE POLICY expedicao_pk_delete ON public.expedicao_pickings
  FOR DELETE TO authenticated
  USING (public.expedicao_has_at_least('admin'::app_role));

-- ===== expedicao_picking_itens =====
DROP POLICY IF EXISTS expedicao_pki_write ON public.expedicao_picking_itens;
CREATE POLICY expedicao_pki_insert ON public.expedicao_picking_itens
  FOR INSERT TO authenticated
  WITH CHECK (public.has_module('expedicao'));
CREATE POLICY expedicao_pki_update ON public.expedicao_picking_itens
  FOR UPDATE TO authenticated
  USING (public.has_module('expedicao'))
  WITH CHECK (public.has_module('expedicao'));
CREATE POLICY expedicao_pki_delete ON public.expedicao_picking_itens
  FOR DELETE TO authenticated
  USING (public.expedicao_has_at_least('supervisor'::app_role));
