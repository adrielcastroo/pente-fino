-- Fix: register_app_release deve verificar apenas por version, não (version, build_time)
-- Cada deploy gera um build_time diferente, causando linhas duplicadas para a mesma versão.
-- Agora a função verifica apenas por version: se existe, apenas atualiza is_current e build_time.

CREATE OR REPLACE FUNCTION public.register_app_release(
  p_version TEXT,
  p_build_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
BEGIN
  IF p_version IS NULL OR btrim(p_version) = '' THEN RETURN; END IF;

  -- Busca por versão apenas (ignora build_time): se já existe, apenas marca como atual
  SELECT id INTO v_existing_id
  FROM public.app_releases
  WHERE version = p_version
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Versão já existe: desmarca as demais e marca esta como atual
    UPDATE public.app_releases SET is_current = false WHERE is_current = true AND id <> v_existing_id;
    UPDATE public.app_releases SET is_current = true WHERE id = v_existing_id;
    -- Atualiza o build_time da versão existente para o mais recente
    UPDATE public.app_releases SET build_time = p_build_time WHERE id = v_existing_id;
    RETURN;
  END IF;

  -- Nova versão: insere linha
  UPDATE public.app_releases SET is_current = false WHERE is_current = true;
  INSERT INTO public.app_releases (version, build_time, notes, is_current, is_stable, released_by)
  VALUES (p_version, p_build_time, p_notes, true, false, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_app_release(TEXT, TIMESTAMPTZ, TEXT) TO authenticated, anon, service_role;
