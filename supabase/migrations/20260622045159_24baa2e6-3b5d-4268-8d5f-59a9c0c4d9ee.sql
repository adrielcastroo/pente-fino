
-- 1) Normalizar dados existentes
UPDATE public.conferences
SET conferente = INITCAP(LOWER(TRIM(conferente)))
WHERE conferente IS NOT NULL AND conferente <> INITCAP(LOWER(TRIM(conferente)));

UPDATE public.conferences
SET processo = UPPER(TRIM(processo))
WHERE processo IS NOT NULL AND processo <> UPPER(TRIM(processo));

UPDATE public.registros
SET nf = UPPER(TRIM(nf))
WHERE nf IS NOT NULL AND nf <> UPPER(TRIM(nf));

UPDATE public.estoque_saidas
SET conferente_saida = INITCAP(LOWER(TRIM(conferente_saida)))
WHERE conferente_saida IS NOT NULL AND conferente_saida <> INITCAP(LOWER(TRIM(conferente_saida)));

-- 2) Função de normalização
CREATE OR REPLACE FUNCTION public.normalize_text_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'conferences' THEN
    IF NEW.conferente IS NOT NULL THEN
      NEW.conferente := INITCAP(LOWER(TRIM(NEW.conferente)));
    END IF;
    IF NEW.processo IS NOT NULL THEN
      NEW.processo := UPPER(TRIM(NEW.processo));
    END IF;
  ELSIF TG_TABLE_NAME = 'registros' THEN
    IF NEW.nf IS NOT NULL THEN
      NEW.nf := UPPER(TRIM(NEW.nf));
    END IF;
  ELSIF TG_TABLE_NAME = 'estoque_saidas' THEN
    IF NEW.conferente_saida IS NOT NULL THEN
      NEW.conferente_saida := INITCAP(LOWER(TRIM(NEW.conferente_saida)));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Triggers
DROP TRIGGER IF EXISTS trg_normalize_conferences ON public.conferences;
CREATE TRIGGER trg_normalize_conferences
  BEFORE INSERT OR UPDATE ON public.conferences
  FOR EACH ROW EXECUTE FUNCTION public.normalize_text_fields();

DROP TRIGGER IF EXISTS trg_normalize_registros ON public.registros;
CREATE TRIGGER trg_normalize_registros
  BEFORE INSERT OR UPDATE ON public.registros
  FOR EACH ROW EXECUTE FUNCTION public.normalize_text_fields();

DROP TRIGGER IF EXISTS trg_normalize_estoque_saidas ON public.estoque_saidas;
CREATE TRIGGER trg_normalize_estoque_saidas
  BEFORE INSERT OR UPDATE ON public.estoque_saidas
  FOR EACH ROW EXECUTE FUNCTION public.normalize_text_fields();
