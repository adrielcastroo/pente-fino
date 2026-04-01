ALTER TABLE public.registros
ADD COLUMN IF NOT EXISTS tipo_tecido text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS modo_origem text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS was_edited boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_by text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;