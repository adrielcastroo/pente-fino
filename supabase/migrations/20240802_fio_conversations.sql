CREATE TABLE public.fio_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fio_conversations TO authenticated;
GRANT ALL ON public.fio_conversations TO service_role;

ALTER TABLE public.fio_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
ON public.fio_conversations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.fio_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.fio_conversations(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content text NOT NULL,
    provider text,
    model text,
    task text,
    found_data boolean DEFAULT false,
    latency_ms int,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fio_messages TO authenticated;
GRANT ALL ON public.fio_messages TO service_role;

ALTER TABLE public.fio_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages of their own conversations"
ON public.fio_messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.fio_conversations
        WHERE id = conversation_id AND user_id = auth.uid()
    )
);

CREATE INDEX idx_fio_messages_conversation_created ON public.fio_messages(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_fio_conversations_updated_at
    BEFORE UPDATE ON public.fio_conversations
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
