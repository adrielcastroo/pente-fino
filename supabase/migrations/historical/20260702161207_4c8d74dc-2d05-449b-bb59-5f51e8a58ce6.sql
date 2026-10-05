CREATE OR REPLACE FUNCTION public.log_expedicao_peca_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_acao TEXT;
  v_detalhes JSONB := '{}'::jsonb;
  v_carrinho_origem UUID;
  v_carrinho_destino UUID;
  v_romaneio UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_acao := 'criada';
    v_detalhes := jsonb_build_object('status', NEW.status);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_acao := 'status:' || COALESCE(NEW.status, 'null');
      v_detalhes := jsonb_build_object('de', OLD.status, 'para', NEW.status);
    ELSIF OLD.carrinho_id IS DISTINCT FROM NEW.carrinho_id THEN
      v_acao := CASE WHEN NEW.carrinho_id IS NULL THEN 'removida_carrinho' ELSE 'alocada_carrinho' END;
      v_carrinho_origem := OLD.carrinho_id;
      v_carrinho_destino := NEW.carrinho_id;
      v_detalhes := jsonb_build_object('carrinho_id', NEW.carrinho_id);
    ELSIF OLD.romaneio_id IS DISTINCT FROM NEW.romaneio_id THEN
      v_acao := CASE WHEN NEW.romaneio_id IS NULL THEN 'removida_romaneio' ELSE 'vinculada_romaneio' END;
      v_romaneio := NEW.romaneio_id;
      v_detalhes := jsonb_build_object('romaneio_id', NEW.romaneio_id);
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.expedicao_pecas_historico
    (peca_id, acao, detalhes, usuario_id, carrinho_origem_id, carrinho_destino_id, romaneio_id)
  VALUES
    (COALESCE(NEW.id, OLD.id), v_acao, v_detalhes, auth.uid(), v_carrinho_origem, v_carrinho_destino, v_romaneio);
  RETURN NEW;
END;
$function$;