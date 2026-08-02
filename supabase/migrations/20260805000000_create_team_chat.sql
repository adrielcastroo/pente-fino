-- Tabela para mensagens entre usuários (Team Chat)
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissões
GRANT SELECT, INSERT ON public.team_messages TO authenticated;
GRANT ALL ON public.team_messages TO service_role;

-- RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can select messages" ON public.team_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can insert their own messages" ON public.team_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Otimização
CREATE INDEX IF NOT EXISTS team_messages_created_at_idx ON public.team_messages(created_at DESC);
