-- SEC-002: Restringir políticas RLS que usam USING (true) em tabelas sensíveis
-- Modelo: public.user_roles (admin/operador/user) + public.get_my_role()
-- Nota: tabelas operacionais de expedição mantêm acesso autenticado amplo

-- team_messages: qualquer autenticado pode ver mensagens
DROP POLICY IF EXISTS "team_messages_select_policy" ON public.team_messages;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_messages' AND policyname='team_messages_select') THEN
    DROP POLICY "team_messages_select" ON public.team_messages;
  END IF;
END $$;
CREATE POLICY "team_messages_select" ON public.team_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));

-- faturamento_regras: apenas admin (sensível — regras de negócio)
DROP POLICY IF EXISTS "faturamento_regras_select" ON public.faturamento_regras;
DROP POLICY IF EXISTS "faturamento_regras_insert" ON public.faturamento_regras;
DROP POLICY IF EXISTS "faturamento_regras_update" ON public.faturamento_regras;
DROP POLICY IF EXISTS "faturamento_regras_delete" ON public.faturamento_regras;
CREATE POLICY "faturamento_admin" ON public.faturamento_regras
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- romaneio_automatico_logs: apenas admin (logs operacionais sensíveis)
DROP POLICY IF EXISTS "romaneio_automatico_logs_select" ON public.romaneio_automatico_logs;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='romaneio_automatico_logs' AND policyname='romaneio_automatico_logs_select') THEN
    DROP POLICY "romaneio_automatico_logs_select" ON public.romaneio_automatico_logs;
  END IF;
END $$;
CREATE POLICY "romaneio_automatico_logs_select" ON public.romaneio_automatico_logs
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');

-- auge_tag_padrao: apenas admin (gerenciamento de tags padrão)
DROP POLICY IF EXISTS "tag_padrao_select" ON public.auge_tag_padrao;
DROP POLICY IF EXISTS "tag_padrao_insert" ON public.auge_tag_padrao;
DROP POLICY IF EXISTS "tag_padrao_update" ON public.auge_tag_padrao;
DROP POLICY IF EXISTS "tag_padrao_delete" ON public.auge_tag_padrao;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='auge_tag_padrao') THEN
    DROP POLICY IF EXISTS "tag_padrao_select" ON public.auge_tag_padrao;
    DROP POLICY IF EXISTS "tag_padrao_insert" ON public.auge_tag_padrao;
    DROP POLICY IF EXISTS "tag_padrao_update" ON public.auge_tag_padrao;
    DROP POLICY IF EXISTS "tag_padrao_delete" ON public.auge_tag_padrao;
  END IF;
END $$;
CREATE POLICY "tag_padrao_admin" ON public.auge_tag_padrao
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- auge_tag_custom: qualquer autenticado pode gerenciar suas próprias tags
DROP POLICY IF EXISTS "tag_custom_select" ON public.auge_tag_custom;
DROP POLICY IF EXISTS "tag_custom_insert" ON public.auge_tag_custom;
DROP POLICY IF EXISTS "tag_custom_update" ON public.auge_tag_custom;
DROP POLICY IF EXISTS "tag_custom_delete" ON public.auge_tag_custom;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='auge_tag_custom') THEN
    DROP POLICY IF EXISTS "tag_custom_select" ON public.auge_tag_custom;
    DROP POLICY IF EXISTS "tag_custom_insert" ON public.auge_tag_custom;
    DROP POLICY IF EXISTS "tag_custom_update" ON public.auge_tag_custom;
    DROP POLICY IF EXISTS "tag_custom_delete" ON public.auge_tag_custom;
  END IF;
END $$;
CREATE POLICY "tag_custom_select" ON public.auge_tag_custom
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));
CREATE POLICY "tag_custom_insert" ON public.auge_tag_custom
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));
CREATE POLICY "tag_custom_update" ON public.auge_tag_custom
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));
CREATE POLICY "tag_custom_delete" ON public.auge_tag_custom
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()));
