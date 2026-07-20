
-- ============ auge_abreviacoes (espelho) ============
CREATE TABLE IF NOT EXISTS public.auge_abreviacoes (
  cd_abreviacao TEXT PRIMARY KEY,
  cd_empresa TEXT,
  id_tipo_abreviacao TEXT NOT NULL,
  ds_atual TEXT NOT NULL,
  ds_abreviada TEXT NOT NULL,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auge_abreviacoes_tipo ON public.auge_abreviacoes(id_tipo_abreviacao);
CREATE INDEX IF NOT EXISTS idx_auge_abreviacoes_ds ON public.auge_abreviacoes(ds_atual);
GRANT SELECT ON public.auge_abreviacoes TO authenticated;
GRANT ALL ON public.auge_abreviacoes TO service_role;
ALTER TABLE public.auge_abreviacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auge_abreviacoes_read" ON public.auge_abreviacoes FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_auge_abreviacoes_updated BEFORE UPDATE ON public.auge_abreviacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ auge_dicionarios (classes/subclasses/combinacoes/tags) ============
CREATE TABLE IF NOT EXISTS public.auge_dicionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('classe','sub_classe','combinacao','tag')),
  cd TEXT NOT NULL,
  nm TEXT NOT NULL,
  cd_pai TEXT,
  nm_pai TEXT,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tipo, cd)
);
CREATE INDEX IF NOT EXISTS idx_auge_dicionarios_tipo ON public.auge_dicionarios(tipo);
CREATE INDEX IF NOT EXISTS idx_auge_dicionarios_nm ON public.auge_dicionarios(nm);
GRANT SELECT ON public.auge_dicionarios TO authenticated;
GRANT ALL ON public.auge_dicionarios TO service_role;
ALTER TABLE public.auge_dicionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auge_dicionarios_read" ON public.auge_dicionarios FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_auge_dicionarios_updated BEFORE UPDATE ON public.auge_dicionarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ abreviacoes_solicitadas (fila interna) ============
CREATE TABLE IF NOT EXISTS public.abreviacoes_solicitadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'Descrição do Item',
  ds_atual TEXT NOT NULL,
  ds_abreviada TEXT NOT NULL,
  motivo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','rejeitada','efetivada')),
  solicitante_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solicitante_email TEXT,
  revisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revisor_email TEXT,
  revisado_em TIMESTAMPTZ,
  obs_revisao TEXT,
  cd_abreviacao_efetivada TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abrev_solic_status ON public.abreviacoes_solicitadas(status);
CREATE INDEX IF NOT EXISTS idx_abrev_solic_solicitante ON public.abreviacoes_solicitadas(solicitante_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abreviacoes_solicitadas TO authenticated;
GRANT ALL ON public.abreviacoes_solicitadas TO service_role;
ALTER TABLE public.abreviacoes_solicitadas ENABLE ROW LEVEL SECURITY;

-- leitura: qualquer autenticado (fila é operacional, útil pra todos)
CREATE POLICY "abrev_solic_read" ON public.abreviacoes_solicitadas
  FOR SELECT TO authenticated USING (true);

-- criação: qualquer usuário autenticado cria em seu nome
CREATE POLICY "abrev_solic_insert_self" ON public.abreviacoes_solicitadas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = solicitante_id);

-- edição pelo próprio solicitante, apenas enquanto pendente
CREATE POLICY "abrev_solic_update_own_pending" ON public.abreviacoes_solicitadas
  FOR UPDATE TO authenticated
  USING (auth.uid() = solicitante_id AND status = 'pendente')
  WITH CHECK (auth.uid() = solicitante_id AND status = 'pendente');

-- exclusão pelo próprio solicitante, apenas enquanto pendente
CREATE POLICY "abrev_solic_delete_own_pending" ON public.abreviacoes_solicitadas
  FOR DELETE TO authenticated
  USING (auth.uid() = solicitante_id AND status = 'pendente');

-- revisão / edição / exclusão por gerentes e admins
CREATE POLICY "abrev_solic_manage_gerente" ON public.abreviacoes_solicitadas
  FOR UPDATE TO authenticated
  USING (public.is_at_least('gerente'::public.app_role))
  WITH CHECK (public.is_at_least('gerente'::public.app_role));

CREATE POLICY "abrev_solic_delete_gerente" ON public.abreviacoes_solicitadas
  FOR DELETE TO authenticated
  USING (public.is_at_least('gerente'::public.app_role));

CREATE TRIGGER trg_abrev_solic_updated BEFORE UPDATE ON public.abreviacoes_solicitadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
