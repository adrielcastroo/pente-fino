
-- =========================================================
-- 1) USER ROLES (substitui check por e-mail)
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'operador', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- Bootstrap: promove admin@pentefino.com a admin se existir
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'admin@pentefino.com'
ON CONFLICT DO NOTHING;

-- Impede usuários de modificarem o próprio papel
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 2) FIX auth_audit_logs: bloquear INSERT público
-- =========================================================
DROP POLICY IF EXISTS "Allow service role to insert logs" ON public.auth_audit_logs;
-- service_role bypassa RLS, então não precisa de policy de INSERT.

-- =========================================================
-- 3) REMOVER POLICIES DUPLICADAS / ANON WRITES
-- =========================================================
-- conferences
DROP POLICY IF EXISTS "Anyone can insert conferences" ON public.conferences;
DROP POLICY IF EXISTS "Authenticated can insert" ON public.conferences;
DROP POLICY IF EXISTS "Authenticated can update" ON public.conferences;
DROP POLICY IF EXISTS "Authenticated can delete" ON public.conferences;
DROP POLICY IF EXISTS "Authenticated users can delete conferences" ON public.conferences;

CREATE POLICY "Admin can delete conferences"
  ON public.conferences FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- estoque_posicoes
DROP POLICY IF EXISTS "Anyone can insert estoque_posicoes" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Anyone can update estoque_posicoes" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Authenticated can insert" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Authenticated can update" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Authenticated can delete" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Authenticated users can delete estoque" ON public.estoque_posicoes;

CREATE POLICY "Admin can delete estoque"
  ON public.estoque_posicoes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- configuracoes_inventario duplicadas
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.configuracoes_inventario;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.configuracoes_inventario;

-- =========================================================
-- 4) Revogar privilégios desnecessários do role anon
-- =========================================================
REVOKE INSERT, UPDATE, DELETE ON public.conferences FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.estoque_posicoes FROM anon;

-- =========================================================
-- 5) ÍNDICES em FKs e colunas de filtro frequente
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_registros_conference_id ON public.registros(conference_id);
CREATE INDEX IF NOT EXISTS idx_registros_lote_mestre_id ON public.registros(lote_mestre_id);
CREATE INDEX IF NOT EXISTS idx_registros_created_at ON public.registros(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_estoque_posicoes_endereco ON public.estoque_posicoes(endereco);
CREATE INDEX IF NOT EXISTS idx_estoque_posicoes_item ON public.estoque_posicoes(item);
CREATE INDEX IF NOT EXISTS idx_estoque_saidas_created_at ON public.estoque_saidas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conferences_finished_at ON public.conferences(finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_independent_reservations_created_at ON public.independent_reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_email_created ON public.auth_audit_logs(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
