
ALTER TABLE public.app_releases ADD COLUMN IF NOT EXISTS build_time TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_app_releases_version_build ON public.app_releases (version, COALESCE(build_time, '1970-01-01'::timestamptz));

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

  SELECT id INTO v_existing_id
  FROM public.app_releases
  WHERE version = p_version AND COALESCE(build_time, '1970-01-01'::timestamptz) = COALESCE(p_build_time, '1970-01-01'::timestamptz)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.app_releases SET is_current = false WHERE is_current = true AND id <> v_existing_id;
    UPDATE public.app_releases SET is_current = true WHERE id = v_existing_id;
    RETURN;
  END IF;

  UPDATE public.app_releases SET is_current = false WHERE is_current = true;
  INSERT INTO public.app_releases (version, build_time, notes, is_current, is_stable, released_by)
  VALUES (p_version, p_build_time, p_notes, true, false, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_app_release(TEXT, TIMESTAMPTZ, TEXT) TO authenticated, anon, service_role;
