-- Create report_settings table
CREATE TABLE public.report_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    email_recipients TEXT[] NOT NULL,
    daily_enabled BOOLEAN DEFAULT true,
    weekly_enabled BOOLEAN DEFAULT true,
    monthly_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own report settings" 
ON public.report_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- Create report_logs table
CREATE TABLE public.report_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT NOT NULL,
    recipient_count INTEGER,
    error_message TEXT
);

-- Enable RLS
ALTER TABLE public.report_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Viewable by authenticated users)
CREATE POLICY "Users can view report logs" 
ON public.report_logs 
FOR SELECT 
USING (auth.role() = 'authenticated');
