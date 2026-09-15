-- Migration: add last_synced_at column to auge_sync_runs
-- Allows incremental sync of pedidos
BEGIN;

ALTER TABLE public.auge_sync_runs
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

COMMIT;