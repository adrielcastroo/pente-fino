CREATE TABLE IF NOT EXISTS public.app_global_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.app_global_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_global_settings TO authenticated;
GRANT ALL ON public.app_global_settings TO service_role;

ALTER TABLE public.app_global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "global settings readable by everyone"
  ON public.app_global_settings FOR SELECT USING (true);

CREATE POLICY "admins manage global settings"
  ON public.app_global_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER app_global_settings_updated_at
  BEFORE UPDATE ON public.app_global_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_global_settings;