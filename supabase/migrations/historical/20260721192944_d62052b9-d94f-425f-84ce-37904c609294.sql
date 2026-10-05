
CREATE TABLE public.auge_credentials (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  base_url TEXT,
  username TEXT,
  password TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auge_credentials TO authenticated;
GRANT ALL ON public.auge_credentials TO service_role;
ALTER TABLE public.auge_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage auge_credentials" ON public.auge_credentials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
INSERT INTO public.auge_credentials (id) VALUES (true) ON CONFLICT DO NOTHING;
