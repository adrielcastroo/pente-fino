-- ============ Tabela de integrações centralizadas ============
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'unknown',
  is_coming_soon BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at TIMESTAMPTZ,
  last_error TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read integrations"
  ON public.integrations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify integrations"
  ON public.integrations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed integrações atuais e futuras
INSERT INTO public.integrations (key, name, category, status, is_coming_soon, notes) VALUES
  ('ai_vision', 'IA — Visão (etiquetas)', 'ai', 'active', false, 'Lovable AI Gateway — extração de dados de fotos'),
  ('nfe_sefaz', 'SEFAZ (NF-e)', 'fiscal', 'active', false, 'Consulta oficial via certificado A1'),
  ('nfe_meudanfe', 'MeuDanfe', 'fiscal', 'active', false, 'Fallback para consulta de NF-e'),
  ('nfe_import', 'NF-e Import (Apps Script)', 'fiscal', 'active', false, 'Webhook de importação automática'),
  ('seurastreio', 'SeuRastreio', 'logistica', 'active', false, 'Rastreamento de entregas'),
  ('n8n_webhook', 'n8n (Webhooks)', 'automacao', 'active', false, 'Proxy para automações externas'),
  ('emails', 'E-mails transacionais', 'comunicacao', 'inactive', true, 'Configurar Lovable Emails ou Resend'),
  ('sap_b1', 'SAP Business One', 'erp', 'inactive', true, 'Integração com ERP corporativo'),
  ('auge_suite', 'Auge Suite', 'erp', 'inactive', true, 'ERP Auge — importação de pedidos'),
  ('external_db', 'Banco de dados externo', 'infra', 'inactive', true, 'Espelhamento / read replica'),
  ('sentry', 'Sentry (erros)', 'observabilidade', 'inactive', true, 'Monitoramento de erros em produção'),
  ('posthog', 'PostHog (analytics)', 'observabilidade', 'inactive', true, 'Analytics de uso por feature')
ON CONFLICT (key) DO NOTHING;