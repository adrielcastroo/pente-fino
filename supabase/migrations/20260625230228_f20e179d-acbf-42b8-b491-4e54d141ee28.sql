
-- Add modules column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS modules text[] NOT NULL DEFAULT ARRAY['estoque']::text[];

-- Seed: admins get both modules
UPDATE public.profiles p
SET modules = ARRAY['estoque','expedicao']::text[]
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'admin'::public.app_role
)
AND NOT ('expedicao' = ANY(p.modules));

-- Helper RPC: returns modules of the current user
CREATE OR REPLACE FUNCTION public.get_my_modules()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT modules FROM public.profiles WHERE id = auth.uid()),
    ARRAY['estoque']::text[]
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_modules() TO authenticated;
