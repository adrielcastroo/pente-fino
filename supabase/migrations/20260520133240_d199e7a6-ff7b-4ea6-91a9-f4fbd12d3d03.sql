-- Add posicao column to registros table
ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS posicao INTEGER;

-- Ensure the column is also added to any view that might be used for history if applicable
-- (In this case, history seems to be fetched from conferences -> registros relation)
