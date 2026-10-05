
CREATE OR REPLACE FUNCTION public.log_expedicao_peca_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evento TEXT;
  v_detalhes JSONB := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_evento := 'criada';
    v_detalhes := jsonb_build_object('status', NEW.status);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_evento := 'status:' || COALESCE(NEW.status, 'null');
      v_detalhes := jsonb_build_object('de', OLD.status, 'para', NEW.status);
    ELSIF OLD.carrinho_id IS DISTINCT FROM NEW.carrinho_id THEN
      v_evento := CASE WHEN NEW.carrinho_id IS NULL THEN 'removida_carrinho' ELSE 'alocada_carrinho' END;
      v_detalhes := jsonb_build_object('carrinho_id', NEW.carrinho_id);
    ELSIF OLD.romaneio_id IS DISTINCT FROM NEW.romaneio_id THEN
      v_evento := CASE WHEN NEW.romaneio_id IS NULL THEN 'removida_romaneio' ELSE 'vinculada_romaneio' END;
      v_detalhes := jsonb_build_object('romaneio_id', NEW.romaneio_id);
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.expedicao_pecas_historico (peca_id, evento, detalhes, user_id)
  VALUES (COALESCE(NEW.id, OLD.id), v_evento, v_detalhes, auth.uid());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exp_pecas_historico ON public.expedicao_pecas;
CREATE TRIGGER trg_exp_pecas_historico
AFTER INSERT OR UPDATE ON public.expedicao_pecas
FOR EACH ROW EXECUTE FUNCTION public.log_expedicao_peca_change();
