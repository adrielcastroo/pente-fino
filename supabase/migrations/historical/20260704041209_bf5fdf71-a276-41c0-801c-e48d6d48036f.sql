-- Normaliza um código (uppercase, remove não alfanuméricos, tira zeros à esquerda se puramente numérico)
CREATE OR REPLACE FUNCTION public.normalizar_codigo(v text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  clean text;
BEGIN
  IF v IS NULL THEN RETURN ''; END IF;
  clean := regexp_replace(upper(v), '[^A-Z0-9]', '', 'g');
  IF clean ~ '^\d+$' THEN
    clean := regexp_replace(clean, '^0+', '');
    IF clean = '' THEN clean := '0'; END IF;
  END IF;
  RETURN clean;
END;
$$;

-- Aplica a descrição do cadastro em estoque_posicoes.item para todos os códigos (interno + fornecedor) desse cadastro
CREATE OR REPLACE FUNCTION public.aplicar_descricao_cadastro(_codigo_interno text, _descricao text, _codigos_norm text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alvo text[];
BEGIN
  IF _descricao IS NULL OR btrim(_descricao) = '' THEN RETURN; END IF;
  alvo := COALESCE(_codigos_norm, ARRAY[]::text[]) || ARRAY[public.normalizar_codigo(_codigo_interno)];

  UPDATE public.estoque_posicoes
     SET item = _descricao
   WHERE item IS DISTINCT FROM _descricao
     AND public.normalizar_codigo(item) = ANY(alvo);
END;
$$;

-- Trigger: sempre que um cadastro for criado/atualizado, propaga a descrição para o estoque
CREATE OR REPLACE FUNCTION public.trg_itens_cadastro_apply_desc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.descricao IS NOT DISTINCT FROM OLD.descricao
     AND NEW.codigos_fornecedor_normalizado IS NOT DISTINCT FROM OLD.codigos_fornecedor_normalizado
     AND NEW.codigo_interno IS NOT DISTINCT FROM OLD.codigo_interno THEN
    RETURN NEW;
  END IF;

  PERFORM public.aplicar_descricao_cadastro(
    NEW.codigo_interno,
    NEW.descricao,
    NEW.codigos_fornecedor_normalizado
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS itens_cadastro_apply_desc ON public.itens_cadastro;
CREATE TRIGGER itens_cadastro_apply_desc
AFTER INSERT OR UPDATE ON public.itens_cadastro
FOR EACH ROW
EXECUTE FUNCTION public.trg_itens_cadastro_apply_desc();

-- Backfill retroativo: aplica a descrição de todos os cadastros já existentes ao estoque atual
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT codigo_interno, descricao, codigos_fornecedor_normalizado
             FROM public.itens_cadastro
            WHERE descricao IS NOT NULL AND btrim(descricao) <> ''
  LOOP
    PERFORM public.aplicar_descricao_cadastro(r.codigo_interno, r.descricao, r.codigos_fornecedor_normalizado);
  END LOOP;
END $$;