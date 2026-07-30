CREATE TABLE public.auge_tag_custom_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'criacao' CHECK (tipo IN ('criacao','edicao','relancamento')),
  ok BOOLEAN NOT NULL DEFAULT true,
  descricao TEXT NOT NULL,
  cd_configuracao TEXT,
  nm_configuracao TEXT,
  linhas JSONB NOT NULL DEFAULT '[]'::jsonb,
  gravadas INTEGER,
  total INTEGER,
  erro TEXT,
  user_id UUID,
  user_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auge_tag_custom_historico TO authenticated;
GRANT ALL ON public.auge_tag_custom_historico TO service_role;

ALTER TABLE public.auge_tag_custom_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem todo o historico de TAGs"
  ON public.auge_tag_custom_historico FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Autenticados registram suas proprias acoes"
  ON public.auge_tag_custom_historico FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Autor gerente ou admin apaga registros"
  ON public.auge_tag_custom_historico FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'gerente'::public.app_role)
  );

CREATE INDEX idx_auge_tag_custom_historico_created_at
  ON public.auge_tag_custom_historico (created_at DESC);
CREATE INDEX idx_auge_tag_custom_historico_cfg
  ON public.auge_tag_custom_historico (cd_configuracao);

ALTER TABLE public.auge_tag_custom_historico REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auge_tag_custom_historico;