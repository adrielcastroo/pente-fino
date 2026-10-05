
ALTER TABLE public.independent_reservations
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_name text,
  ADD COLUMN IF NOT EXISTS last_edited_field text,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;
