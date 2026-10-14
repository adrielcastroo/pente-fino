-- Regras de tag padrão para verificação de conformidade na Busca Avançada.
-- Cada regra mapeia um padrão de nome de configuração (padrao_nm) para a tag
-- padrão esperada (tag_padrao). Ex: ('Motor', 'mot').
-- Configurações cujo nm_configuracao contém o padrão e que não possuem ao menos
-- uma tag customizada com ds_tag_customizada igual ao tag_padrao são marcadas
-- como "fora do padrão" na interface de Busca Avançada.

CREATE TABLE IF NOT EXISTS public.auge_tag_padrao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  padrao_nm TEXT NOT NULL,
  tag_padrao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auge_tag_padrao_ativo
  ON public.auge_tag_padrao(ativo);

-- Permissões GRANT (para roles do banco)
GRANT ALL ON TABLE public.auge_tag_padrao TO anon;
GRANT ALL ON TABLE public.auge_tag_padrao TO authenticated;
GRANT ALL ON TABLE public.auge_tag_padrao TO service_role;

ALTER TABLE public.auge_tag_padrao ENABLE ROW LEVEL SECURITY;

-- Regras iniciais de exemplo (Motor → mot, Cortina → cortina, Rollo → rollo).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.auge_tag_padrao WHERE padrao_nm = 'Motor') THEN
    INSERT INTO public.auge_tag_padrao (padrao_nm, tag_padrao, ativo) VALUES
      ('Motor', 'mot', true),
      ('Cortina', 'cortina', true),
      ('Rollo', 'rollo', true);
  END IF;
END
$$;

-- Políticas RLS: anônimo e autenticado podem ler; service_role pode tudo.
DROP POLICY IF EXISTS "tag_padrao_all" ON public.auge_tag_padrao;

CREATE POLICY "tag_padrao_read"
  ON public.auge_tag_padrao
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "tag_padrao_write"
  ON public.auge_tag_padrao
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
