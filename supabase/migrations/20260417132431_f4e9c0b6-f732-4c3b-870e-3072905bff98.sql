-- Create audit logs for auth events
CREATE TABLE public.auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- e.g., 'forgot_password_request', 'password_reset_success'
    email TEXT NOT NULL,
    ip_address TEXT,
    status TEXT NOT NULL, -- 'success', 'failure'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view only their own logs (if email matches)
-- In a real app, this might be restricted to admins
CREATE POLICY "Users can view their own auth logs"
    ON public.auth_audit_logs
    FOR SELECT
    USING (auth.jwt() ->> 'email' = email);

-- Allow service role to insert logs
CREATE POLICY "Allow service role to insert logs"
    ON public.auth_audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Create a function to help with rate limiting checks
CREATE OR REPLACE FUNCTION public.check_reset_rate_limit(target_email TEXT, window_minutes INT, max_attempts INT)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INT;
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
