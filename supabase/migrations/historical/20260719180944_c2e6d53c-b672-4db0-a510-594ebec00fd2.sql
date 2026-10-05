ALTER TABLE public.app_releases DROP CONSTRAINT IF EXISTS app_releases_version_key;
CREATE UNIQUE INDEX IF NOT EXISTS app_releases_version_build_time_key
  ON public.app_releases (version, COALESCE(build_time, '1970-01-01'::timestamptz));