
CREATE OR REPLACE FUNCTION public.get_necessidade_cron()
RETURNS TABLE(jobid bigint, schedule text, active boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT jobid, schedule, active
  FROM cron.job
  WHERE jobname = 'necessidade-cron-diaria'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_necessidade_cron() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_necessidade_cron() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_necessidade_cron(cron_expr text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  j record;
  cmd text;
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWhyaHFmYnd2Z3B1cnBtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTMyOTYsImV4cCI6MjA5MDAyOTI5Nn0.D2ePvias7HlH94bpkkYbHc1WKx79Yh89kXVu92Zhepw';
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o cron.';
  END IF;
  IF cron_expr IS NULL OR btrim(cron_expr) = '' THEN
    RAISE EXCEPTION 'Expressão cron inválida.';
  END IF;

  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'necessidade-cron-diaria' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;

  cmd := format($c$
    select net.http_post(
      url:='https://dlehrhqfbwvgpurpmmht.supabase.co/functions/v1/auge-sync?action=necessidade_cron_run',
      headers:=jsonb_build_object('Content-Type','application/json','apikey',%L,'Authorization','Bearer '||%L),
      body:='{}'::jsonb
    ) as request_id;
  $c$, anon_key, anon_key);

  PERFORM cron.schedule('necessidade-cron-diaria', cron_expr, cmd);
  RETURN cron_expr;
END;
$$;

REVOKE ALL ON FUNCTION public.set_necessidade_cron(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_necessidade_cron(text) TO authenticated;
