-- 1. Create lotes_mestres table
CREATE TABLE public.lotes_mestres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor_hex TEXT NOT NULL DEFAULT '#cccccc',
  descricao TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lotes_mestres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lotes mestres"
ON public.lotes_mestres FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lotes mestres"
ON public.lotes_mestres FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their lotes mestres"
ON public.lotes_mestres FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their lotes mestres"
ON public.lotes_mestres FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Reuse existing timestamp trigger function if it exists; otherwise create generic one
CREATE OR REPLACE FUNCTION public.update_lotes_mestres_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lotes_mestres_updated_at
BEFORE UPDATE ON public.lotes_mestres
FOR EACH ROW
EXECUTE FUNCTION public.update_lotes_mestres_updated_at();

-- 2. Extend registros table
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS lote_mestre_id UUID REFERENCES public.lotes_mestres(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avaria_tipo TEXT,
  ADD COLUMN IF NOT EXISTS avaria_descricao TEXT,
  ADD COLUMN IF NOT EXISTS avaria_foto_url TEXT;

CREATE INDEX IF NOT EXISTS idx_registros_lote_mestre_id ON public.registros(lote_mestre_id);
CREATE INDEX IF NOT EXISTS idx_registros_avaria_tipo ON public.registros(avaria_tipo) WHERE avaria_tipo IS NOT NULL;

-- 3. Create storage bucket for madeira avarias photos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('madeira-avarias', 'madeira-avarias', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: each user manages files inside their own folder (auth.uid()/...)
CREATE POLICY "Authenticated can view madeira avarias"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'madeira-avarias');

CREATE POLICY "Users upload to their own madeira avarias folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'madeira-avarias'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update their own madeira avarias files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'madeira-avarias'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete their own madeira avarias files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'madeira-avarias'
  AND auth.uid()::text = (storage.foldername(name))[1]
);