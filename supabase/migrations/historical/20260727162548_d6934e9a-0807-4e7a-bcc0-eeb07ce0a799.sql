
CREATE TABLE IF NOT EXISTS public.auge_user_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_url TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auge_user_credentials TO authenticated;
GRANT ALL ON public.auge_user_credentials TO service_role;

ALTER TABLE public.auge_user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auge_user_credentials_own_select"
  ON public.auge_user_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "auge_user_credentials_own_insert"
  ON public.auge_user_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auge_user_credentials_own_update"
  ON public.auge_user_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auge_user_credentials_own_delete"
  ON public.auge_user_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_auge_user_credentials_updated_at
  BEFORE UPDATE ON public.auge_user_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper RPC to check without exposing rows
CREATE OR REPLACE FUNCTION public.i_have_auge_credentials()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auge_user_credentials
    WHERE user_id = auth.uid()
      AND username IS NOT NULL AND btrim(username) <> ''
      AND password IS NOT NULL AND length(password) > 0
  );
$$;

GRANT EXECUTE ON FUNCTION public.i_have_auge_credentials() TO authenticated;
