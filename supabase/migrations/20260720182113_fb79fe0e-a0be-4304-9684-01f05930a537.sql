
-- Tabela mestre de acabamentos do Auge
CREATE TABLE public.auge_acabamentos (
  cd_acabamento TEXT PRIMARY KEY,
  nr_acabamento TEXT,
  chave_acabamento TEXT,
  cd_empresa TEXT,
  nm_acabamento TEXT NOT NULL,
  id_cancelado TEXT DEFAULT 'N',
  cd_classe1 TEXT, cd_sub_classe1 TEXT, cd_combinacao1 TEXT,
  nm_classe1 TEXT, nm_sub_classe1 TEXT, nm_combinacao1 TEXT, chave_combinacao1 TEXT,
  cd_classe2 TEXT, cd_sub_classe2 TEXT, cd_combinacao2 TEXT,
  nm_classe2 TEXT, nm_sub_classe2 TEXT, nm_combinacao2 TEXT, chave_combinacao2 TEXT,
  cd_classe3 TEXT, cd_sub_classe3 TEXT, cd_combinacao3 TEXT,
  nm_classe3 TEXT, nm_sub_classe3 TEXT, nm_combinacao3 TEXT, chave_combinacao3 TEXT,
  cd_seq_tag_calculada TEXT,
  ds_tag_calculada TEXT,
  ds_descricao_tag_calculada TEXT,
  id_herdar_colecao TEXT,
  id_limitar_tamanho TEXT,
  tem_item_associado TEXT,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auge_acabamentos_nm ON public.auge_acabamentos (nm_acabamento);
CREATE INDEX idx_auge_acabamentos_cancelado ON public.auge_acabamentos (id_cancelado);

GRANT SELECT ON public.auge_acabamentos TO authenticated;
GRANT ALL ON public.auge_acabamentos TO service_role;
ALTER TABLE public.auge_acabamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem acabamentos"
  ON public.auge_acabamentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerentes editam acabamentos"
  ON public.auge_acabamentos FOR ALL TO authenticated
  USING (public.is_at_least('gerente'::app_role))
  WITH CHECK (public.is_at_least('gerente'::app_role));

CREATE TRIGGER trg_auge_acabamentos_updated_at
  BEFORE UPDATE ON public.auge_acabamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Itens dos acabamentos (relaciona código do item com o acabamento)
CREATE TABLE public.auge_acabamento_itens (
  cd_acabamento_item TEXT PRIMARY KEY,
  cd_acabamento TEXT NOT NULL REFERENCES public.auge_acabamentos(cd_acabamento) ON DELETE CASCADE,
  cd_linha TEXT,
  cd_item_acabamento TEXT NOT NULL,
  ds_item_acabamento TEXT,
  ds_item_acabamento_original TEXT,
  ds_item_acabamento_reduzida TEXT,
  cd_kit_complementar_1 TEXT, nm_kit_complementar_1 TEXT,
  cd_kit_complementar_2 TEXT, nm_kit_complementar_2 TEXT,
  cd_kit_complementar_3 TEXT, nm_kit_complementar_3 TEXT,
  cd_kit_complementar_4 TEXT, nm_kit_complementar_4 TEXT,
  cd_kit_complementar_5 TEXT, nm_kit_complementar_5 TEXT,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auge_acab_itens_cd_item ON public.auge_acabamento_itens (cd_item_acabamento);
CREATE INDEX idx_auge_acab_itens_cd_acab ON public.auge_acabamento_itens (cd_acabamento);
CREATE INDEX idx_auge_acab_itens_ds ON public.auge_acabamento_itens (ds_item_acabamento);

GRANT SELECT ON public.auge_acabamento_itens TO authenticated;
GRANT ALL ON public.auge_acabamento_itens TO service_role;
ALTER TABLE public.auge_acabamento_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem itens de acabamento"
  ON public.auge_acabamento_itens FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerentes editam itens de acabamento"
  ON public.auge_acabamento_itens FOR ALL TO authenticated
  USING (public.is_at_least('gerente'::app_role))
  WITH CHECK (public.is_at_least('gerente'::app_role));

CREATE TRIGGER trg_auge_acabamento_itens_updated_at
  BEFORE UPDATE ON public.auge_acabamento_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.auge_acabamentos REPLICA IDENTITY FULL;
ALTER TABLE public.auge_acabamento_itens REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auge_acabamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auge_acabamento_itens;
