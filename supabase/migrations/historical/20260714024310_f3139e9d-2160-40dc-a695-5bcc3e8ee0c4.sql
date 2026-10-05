-- Templates
CREATE TABLE IF NOT EXISTS public.etiqueta_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('expedicao','conferencia','devolucao','custom')),
  dimensoes jsonb NOT NULL DEFAULT '{"largura":100,"altura":150}'::jsonb,
  zpl text NOT NULL DEFAULT '',
  variaveis jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  versao int NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.etiqueta_templates TO authenticated;
GRANT ALL ON public.etiqueta_templates TO service_role;

ALTER TABLE public.etiqueta_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etiqueta_templates_select_auth" ON public.etiqueta_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "etiqueta_templates_insert_auth" ON public.etiqueta_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "etiqueta_templates_update_auth" ON public.etiqueta_templates
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "etiqueta_templates_delete_auth" ON public.etiqueta_templates
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_etiqueta_templates_categoria ON public.etiqueta_templates(categoria);
CREATE INDEX IF NOT EXISTS idx_etiqueta_templates_ativo ON public.etiqueta_templates(ativo);

CREATE TRIGGER trg_etiqueta_templates_updated
  BEFORE UPDATE ON public.etiqueta_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Ajuste: o trigger acima usa handle_updated_at que atualiza NEW.updated_at.
-- Como nossa coluna é atualizado_em, criamos função dedicada:
DROP TRIGGER IF EXISTS trg_etiqueta_templates_updated ON public.etiqueta_templates;

CREATE OR REPLACE FUNCTION public.handle_etiqueta_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  NEW.versao = COALESCE(OLD.versao, 1) + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_etiqueta_templates_atualizado
  BEFORE UPDATE ON public.etiqueta_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_etiqueta_atualizado_em();

-- Histórico
CREATE TABLE IF NOT EXISTS public.etiqueta_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.etiqueta_templates(id) ON DELETE SET NULL,
  template_nome text NOT NULL,
  variaveis_usadas jsonb NOT NULL DEFAULT '{}'::jsonb,
  quantidade int NOT NULL DEFAULT 1,
  impressora text,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.etiqueta_historico TO authenticated;
GRANT ALL ON public.etiqueta_historico TO service_role;

ALTER TABLE public.etiqueta_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etiqueta_historico_select_auth" ON public.etiqueta_historico
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "etiqueta_historico_insert_auth" ON public.etiqueta_historico
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_etiqueta_historico_template ON public.etiqueta_historico(template_id);
CREATE INDEX IF NOT EXISTS idx_etiqueta_historico_usuario ON public.etiqueta_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_etiqueta_historico_criado ON public.etiqueta_historico(criado_em DESC);