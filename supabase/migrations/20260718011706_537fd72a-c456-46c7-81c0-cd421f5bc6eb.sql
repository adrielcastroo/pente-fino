ALTER TABLE public.auge_transferencias
  ADD COLUMN IF NOT EXISTS nr_efetivacao text,
  ADD COLUMN IF NOT EXISTS ds_efetivacao text;

CREATE INDEX IF NOT EXISTS idx_auge_transf_nr_efetivacao ON public.auge_transferencias (nr_efetivacao);
CREATE INDEX IF NOT EXISTS idx_auge_transf_documento ON public.auge_transferencias (documento);