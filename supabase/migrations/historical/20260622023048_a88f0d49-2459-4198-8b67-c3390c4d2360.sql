
-- 1) Audit log table (immutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  user_id      uuid,
  user_email   text,
  action       text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  entity       text NOT NULL,
  entity_id    text,
  before_data  jsonb,
  after_data   jsonb,
  changed_keys text[]
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred_at ON public.audit_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id, occurred_at DESC);

-- 2) Grants — only service_role bypasses RLS; everyone else goes through policies
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: gerente or higher
DROP POLICY IF EXISTS "Gerente+ can read audit_logs" ON public.audit_logs;
CREATE POLICY "Gerente+ can read audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_at_least('gerente'::public.app_role));

-- INSERT: any authenticated user (so triggers running as caller can write)
DROP POLICY IF EXISTS "Authenticated can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit_logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- No UPDATE/DELETE policies = immutable for everyone except service_role

-- 3) Generic trigger function
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_entity text := TG_TABLE_NAME;
  v_action text := TG_OP;
  v_before jsonb;
  v_after jsonb;
  v_entity_id text;
  v_changed text[] := ARRAY[]::text[];
  v_key text;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_after := to_jsonb(NEW);
    v_entity_id := COALESCE(v_after->>'id', '');
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after  := to_jsonb(NEW);
    v_entity_id := COALESCE(v_after->>'id', v_before->>'id', '');
    FOR v_key IN SELECT jsonb_object_keys(v_after) LOOP
      IF (v_after->v_key) IS DISTINCT FROM (v_before->v_key) THEN
        v_changed := array_append(v_changed, v_key);
      END IF;
    END LOOP;
    -- Skip pure timestamp-only updates to avoid log noise
    IF array_length(v_changed,1) IS NULL THEN RETURN NEW; END IF;
    IF array_length(v_changed,1) = 1 AND v_changed[1] = 'updated_at' THEN RETURN NEW; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_entity_id := COALESCE(v_before->>'id', '');
  END IF;

  INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, before_data, after_data, changed_keys)
  VALUES (v_uid, v_email, v_action, v_entity, v_entity_id, v_before, v_after, v_changed);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Attach triggers to critical tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'registros','estoque_posicoes','estoque_saidas',
    'itens_cadastro','lotes_mestres','user_roles','conferences'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%1$s ON public.%1$I', t);
    EXECUTE format($f$
      CREATE TRIGGER trg_audit_%1$s
        AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
        FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
    $f$, t);
  END LOOP;
END $$;
