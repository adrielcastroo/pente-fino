
-- 1. teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select_authenticated" ON public.teams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_insert_supervisor" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (public.is_at_least('supervisor'::public.app_role));
CREATE POLICY "teams_update_supervisor" ON public.teams
  FOR UPDATE TO authenticated USING (public.is_at_least('supervisor'::public.app_role))
  WITH CHECK (public.is_at_least('supervisor'::public.app_role));
CREATE POLICY "teams_delete_supervisor" ON public.teams
  FOR DELETE TO authenticated USING (public.is_at_least('supervisor'::public.app_role));

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. team_members
CREATE TABLE public.team_members (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
CREATE INDEX team_members_user_id_idx ON public.team_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select_authenticated" ON public.team_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_members_insert_supervisor" ON public.team_members
  FOR INSERT TO authenticated WITH CHECK (public.is_at_least('supervisor'::public.app_role));
CREATE POLICY "team_members_delete_supervisor" ON public.team_members
  FOR DELETE TO authenticated USING (public.is_at_least('supervisor'::public.app_role));

-- 3. team_page_permissions
CREATE TABLE public.team_page_permissions (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (team_id, user_id, page_key)
);
CREATE INDEX team_page_permissions_user_idx ON public.team_page_permissions(user_id) WHERE allowed = true;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_page_permissions TO authenticated;
GRANT ALL ON public.team_page_permissions TO service_role;
ALTER TABLE public.team_page_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_page_permissions_select_authenticated" ON public.team_page_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_page_permissions_all_supervisor" ON public.team_page_permissions
  FOR ALL TO authenticated
  USING (public.is_at_least('supervisor'::public.app_role))
  WITH CHECK (public.is_at_least('supervisor'::public.app_role));

-- 4. has_page_access(page_key)
CREATE OR REPLACE FUNCTION public.has_page_access(_page_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR NOT EXISTS (
      SELECT 1 FROM public.team_members WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.team_page_permissions
      WHERE user_id = auth.uid() AND page_key = _page_key AND allowed = true
    );
$$;

-- 5. get_my_page_access() -> returns setof text of allowed page_keys (only meaningful when user is in at least one team)
CREATE OR REPLACE FUNCTION public.get_my_page_access()
RETURNS TABLE(page_key TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT tpp.page_key
  FROM public.team_page_permissions tpp
  WHERE tpp.user_id = auth.uid() AND tpp.allowed = true;
$$;

-- Helper: does the current user belong to any team?
CREATE OR REPLACE FUNCTION public.i_am_in_any_team()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid());
$$;
