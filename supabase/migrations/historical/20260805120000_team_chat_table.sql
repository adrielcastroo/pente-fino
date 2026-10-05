-- Tabela para chat entre usuários
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT ON public.team_messages TO authenticated;
GRANT ALL ON public.team_messages TO service_role;

-- RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can see team messages" ON public.team_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can send their own messages" ON public.team_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Index para performance
CREATE INDEX IF NOT EXISTS team_messages_created_at_idx ON public.team_messages(created_at DESC);
