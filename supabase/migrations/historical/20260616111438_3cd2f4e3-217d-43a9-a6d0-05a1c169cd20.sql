ALTER TABLE public.conferences
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();

DROP POLICY IF EXISTS "Authenticated users can insert conferences" ON public.conferences;
CREATE POLICY "Authenticated users can insert conferences"
  ON public.conferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));