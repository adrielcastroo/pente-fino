ALTER TABLE public.auge_tags_calculadas
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS formula text;

-- Backfill: o texto sincronizado costuma vir como "FORMULA\NOME".
UPDATE public.auge_tags_calculadas
SET
  descricao = COALESCE(descricao, nm_tag),
  nome = COALESCE(
    nome,
    NULLIF(btrim(split_part(nm_tag, '\', 2)), ''),
    btrim(nm_tag)
  ),
  formula = COALESCE(
    formula,
    NULLIF(btrim(split_part(nm_tag, '\', 1)), '')
  )
WHERE nome IS NULL OR descricao IS NULL;

CREATE INDEX IF NOT EXISTS idx_auge_tags_calculadas_nome ON public.auge_tags_calculadas (nome);
CREATE INDEX IF NOT EXISTS idx_auge_tags_calculadas_descricao ON public.auge_tags_calculadas (descricao);