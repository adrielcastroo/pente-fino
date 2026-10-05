-- Relaxa o limite de 30 posições apenas para a estrutura 'CHÃO' (sem limite).
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.estoque_posicoes'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%posicao%<=%30%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.estoque_posicoes DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.estoque_posicoes
  ADD CONSTRAINT estoque_posicoes_posicao_check
  CHECK (posicao >= 1 AND (estrutura = 'CHÃO' OR posicao <= 30));