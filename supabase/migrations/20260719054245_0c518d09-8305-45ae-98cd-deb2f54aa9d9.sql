ALTER TABLE public.auge_transferencias
  ADD COLUMN IF NOT EXISTS descricao_produto TEXT;

CREATE INDEX IF NOT EXISTS idx_auge_transferencias_descricao_produto
  ON public.auge_transferencias (descricao_produto)
  WHERE descricao_produto IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auge_transferencias_doc_mov
  ON public.auge_transferencias ((raw->>'cdMovEstoqueERP'), documento, nr_efetivacao);