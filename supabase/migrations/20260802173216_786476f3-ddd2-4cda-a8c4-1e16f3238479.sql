-- Conversas do Fio (garantia)
CREATE TABLE IF NOT EXISTS public.fio_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fio_conversations TO authenticated;
GRANT ALL ON public.fio_conversations TO service_role;
ALTER TABLE public.fio_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fio_conversations_own" ON public.fio_conversations;
CREATE POLICY "fio_conversations_own" ON public.fio_conversations
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.fio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.fio_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fio_messages_conv ON public.fio_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fio_messages TO authenticated;
GRANT ALL ON public.fio_messages TO service_role;
ALTER TABLE public.fio_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fio_messages_own" ON public.fio_messages;
CREATE POLICY "fio_messages_own" ON public.fio_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fio_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.fio_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Memória de longo prazo
CREATE TABLE public.fio_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'preferencia' CHECK (categoria IN ('preferencia','fato','atalho','contexto')),
  origem TEXT NOT NULL DEFAULT 'chat' CHECK (origem IN ('chat','manual','inferido')),
  confianca NUMERIC NOT NULL DEFAULT 1 CHECK (confianca >= 0 AND confianca <= 1),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
CREATE INDEX idx_fio_memories_user ON public.fio_memories(user_id, categoria);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fio_memories TO authenticated;
GRANT ALL ON public.fio_memories TO service_role;

ALTER TABLE public.fio_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fio_memories_own" ON public.fio_memories
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_fio_memories_updated_at
  BEFORE UPDATE ON public.fio_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();