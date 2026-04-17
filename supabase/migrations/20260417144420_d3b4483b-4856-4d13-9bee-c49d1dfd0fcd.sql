-- Create table for auth audit logs
CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    email TEXT,
    user_id UUID,
    status TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role only access to audit logs" 
ON public.auth_audit_logs 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_reset_rate_limit(
    target_email TEXT,
    window_minutes INTEGER DEFAULT 15,
    max_attempts INTEGER DEFAULT 3
) 
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    SELECT count(*)
    INTO attempt_count
    FROM public.auth_audit_logs
    WHERE email = target_email
      AND event_type = 'forgot_password_request'
      AND created_at > now() - (window_minutes || ' minutes')::interval;

    RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log auth events (accessible via RPC if needed, but intended for Edge Functions)
CREATE OR REPLACE FUNCTION public.log_auth_event(
    p_event_type TEXT,
    p_email TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) 
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auth_audit_logs (event_type, email, user_id, status, metadata)
    VALUES (p_event_type, p_email, p_user_id, p_status, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
