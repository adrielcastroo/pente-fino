
-- Liberar leitura pública (anon+authenticated) das tabelas de dados do app.
-- Escrita continua restrita a authenticated. Tabelas sensíveis (profiles,
-- auth_audit_logs, ai_chat_history) NÃO são alteradas.

DO $$
DECLARE
  t text;
  pol record;
  tables text[] := ARRAY[
    'conferences','registros','estoque_posicoes','estoque_saidas',
    'inventory','inventory_configs','inventory_tasks','inventory_task_items','inventory_daily_limits',
    'contagem_itens_bipados','contagens_diarias_limite','historico_contagens','tarefas_contagem',
    'itens_cadastro','lotes_mestres','madeira_quadrantes','movimentacoes_endereco',
    'operation_logs','reservas','independent_reservations',
    'configuracoes_inventario','report_logs','report_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Dropar policies de SELECT e ALL existentes (vamos recriar)
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND cmd IN ('SELECT','ALL')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- Garantir RLS ligado
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- SELECT público (anon + authenticated)
    EXECUTE format(
      'CREATE POLICY "Public read access" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t
    );

    -- Escrita restrita a authenticated (recria caso ALL tenha sido dropada)
    EXECUTE format(
      'CREATE POLICY "Authenticated can insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated can update" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated can delete" ON public.%I FOR DELETE TO authenticated USING (true)', t
    );

    -- GRANTs (necessário no Lovable Cloud)
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;
