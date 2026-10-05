-- Phase B: Profile extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cargo TEXT,
  ADD COLUMN IF NOT EXISTS setor TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Constraint: telefone formato simples (apenas dígitos, espaços, +, -, parênteses; até 20 chars)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_telefone_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_telefone_format
      CHECK (telefone IS NULL OR (char_length(telefone) <= 20 AND telefone ~ '^[0-9+\-\s()]*$'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cargo_len'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_cargo_len CHECK (cargo IS NULL OR char_length(cargo) <= 60);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_setor_len'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_setor_len CHECK (setor IS NULL OR char_length(setor) <= 60);
  END IF;
END $$;

-- RLS para bucket avatars (storage.objects)
-- Usuários podem ver todos os avatares (bucket público)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Usuários autenticados podem fazer upload do próprio avatar (pasta = user_id)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );