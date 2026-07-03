-- import_log
CREATE TABLE public.import_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  file_name TEXT,
  total_linhas INTEGER NOT NULL DEFAULT 0,
  inseridos INTEGER NOT NULL DEFAULT 0,
  atualizados INTEGER NOT NULL DEFAULT 0,
  ignorados INTEGER NOT NULL DEFAULT 0,
  resultado TEXT NOT NULL CHECK (resultado IN ('sucesso','parcial','falha','cancelado')),
  erro TEXT,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_import_log_user ON public.import_log(user_id);
CREATE INDEX idx_import_log_created ON public.import_log(created_at DESC);

GRANT SELECT, INSERT ON public.import_log TO authenticated;
GRANT ALL ON public.import_log TO service_role;

ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario insere proprio import_log"
ON public.import_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuario ve proprio import_log"
ON public.import_log FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "supervisor+ ve todos import_log"
ON public.import_log FOR SELECT TO authenticated
USING (public.is_at_least('supervisor'::app_role));

-- nfe_consulta_log
CREATE TABLE public.nfe_consulta_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  cnpj TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('emitido','recebido','chave')),
  chave_acesso TEXT,
  status TEXT,
  motivo TEXT,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nfe_consulta_log_cnpj ON public.nfe_consulta_log(cnpj);
CREATE INDEX idx_nfe_consulta_log_created ON public.nfe_consulta_log(created_at DESC);

GRANT SELECT, INSERT ON public.nfe_consulta_log TO authenticated;
GRANT ALL ON public.nfe_consulta_log TO service_role;

ALTER TABLE public.nfe_consulta_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario insere proprio nfe_consulta_log"
ON public.nfe_consulta_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuario ve proprio nfe_consulta_log"
ON public.nfe_consulta_log FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "supervisor+ ve todos nfe_consulta_log"
ON public.nfe_consulta_log FOR SELECT TO authenticated
USING (public.is_at_least('supervisor'::app_role) AND public.has_module('expedicao'));