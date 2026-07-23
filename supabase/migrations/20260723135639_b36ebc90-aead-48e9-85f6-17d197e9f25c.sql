
CREATE TABLE public.auge_permissoes (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  areas TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  actions TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auge_permissoes TO authenticated;
GRANT ALL ON public.auge_permissoes TO service_role;

ALTER TABLE public.auge_permissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own auge permissoes"
  ON public.auge_permissoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admin manages auge permissoes"
  ON public.auge_permissoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER auge_permissoes_set_updated_at
  BEFORE UPDATE ON public.auge_permissoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_my_auge_permissoes()
RETURNS TABLE(areas TEXT[], actions TEXT[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(p.areas, ARRAY[]::text[]) AS areas,
    COALESCE(p.actions, ARRAY[]::text[]) AS actions
  FROM (SELECT auth.uid() AS uid) u
  LEFT JOIN public.auge_permissoes p ON p.user_id = u.uid;
$$;

CREATE OR REPLACE FUNCTION public.has_auge_area(_area TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.auge_permissoes
      WHERE user_id = auth.uid() AND _area = ANY(areas)
    );
$$;

CREATE OR REPLACE FUNCTION public.has_auge_action(_action TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.auge_permissoes
      WHERE user_id = auth.uid() AND _action = ANY(actions)
    );
$$;
