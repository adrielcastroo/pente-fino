-- 1. Criação da tabela (independente de políticas)
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Ajuste de Foreign Key para auth.users
ALTER TABLE public.team_messages DROP CONSTRAINT IF EXISTS team_messages_sender_id_fkey;
ALTER TABLE public.team_messages ADD CONSTRAINT team_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Grants e RLS
GRANT SELECT, INSERT ON public.team_messages TO authenticated;
GRANT ALL ON public.team_messages TO service_role;

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas antes de recriar
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone authenticated can select messages" ON public.team_messages;
    DROP POLICY IF EXISTS "Anyone authenticated can insert their own messages" ON public.team_messages;
    DROP POLICY IF EXISTS "Anyone authenticated can see team messages" ON public.team_messages;
    DROP POLICY IF EXISTS "Users can send their own messages" ON public.team_messages;
    DROP POLICY IF EXISTS "team_messages_select_policy" ON public.team_messages;
    DROP POLICY IF EXISTS "team_messages_insert_policy" ON public.team_messages;
END $$;

CREATE POLICY "team_messages_select_policy" ON public.team_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "team_messages_insert_policy" ON public.team_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS team_messages_created_at_idx ON public.team_messages(created_at DESC);

-- 4. Backfill de profiles
INSERT INTO public.profiles (id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u 
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Garantir Triggers de Signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 6. Habilitar Realtime
ALTER TABLE public.team_messages REPLICA IDENTITY FULL;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'team_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;