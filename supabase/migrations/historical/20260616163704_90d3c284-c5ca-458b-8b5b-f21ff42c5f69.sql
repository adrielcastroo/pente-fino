
-- itens_cadastro: add audit columns
ALTER TABLE public.itens_cadastro
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_name text,
  ADD COLUMN IF NOT EXISTS last_edited_field text,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;

-- reservas: add audit + updated_at columns
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_name text,
  ADD COLUMN IF NOT EXISTS last_edited_field text,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;

-- Trigger to bump updated_at on reservas
DROP TRIGGER IF EXISTS update_reservas_updated_at ON public.reservas;
CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
