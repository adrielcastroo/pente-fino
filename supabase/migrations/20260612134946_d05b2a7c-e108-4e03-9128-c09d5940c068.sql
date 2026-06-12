-- Corrigir vulnerabilidades de Search Path Mutable (Lint 0011)

ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.check_reset_rate_limit(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.log_auth_event(text, text, uuid, text, jsonb) SET search_path = public;
-- update_lotes_mestres_updated_at já possui search_path configurado
