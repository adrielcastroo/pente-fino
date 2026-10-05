ALTER TABLE public.expedicao_pickings
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

-- Audit trigger to log cancel/estorno events into audit_logs (reuses existing infra)
DROP TRIGGER IF EXISTS audit_expedicao_pickings ON public.expedicao_pickings;
CREATE TRIGGER audit_expedicao_pickings
AFTER INSERT OR UPDATE OR DELETE ON public.expedicao_pickings
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();