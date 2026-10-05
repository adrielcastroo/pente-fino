CREATE TABLE public.melhor_envio_credentials (
  id INT PRIMARY KEY DEFAULT 1,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  environment TEXT NOT NULL DEFAULT 'production',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton_row CHECK (id = 1)
);
GRANT ALL ON public.melhor_envio_credentials TO service_role;
ALTER TABLE public.melhor_envio_credentials ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) may read/write.
INSERT INTO public.melhor_envio_credentials (id) VALUES (1) ON CONFLICT DO NOTHING;