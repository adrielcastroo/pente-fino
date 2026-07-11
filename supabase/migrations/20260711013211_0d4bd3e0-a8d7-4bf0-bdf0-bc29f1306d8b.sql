CREATE TABLE IF NOT EXISTS public.tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL UNIQUE,
  carrier TEXT NOT NULL,
  carrier_raw JSONB,
  status TEXT NOT NULL DEFAULT 'pendente',
  last_event JSONB,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_type TEXT,
  linked_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracking_links TO authenticated;
GRANT ALL ON public.tracking_links TO service_role;

ALTER TABLE public.tracking_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracking_links_select" ON public.tracking_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "tracking_links_insert" ON public.tracking_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tracking_links_update" ON public.tracking_links FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tracking_links_delete" ON public.tracking_links FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tracking_links_code ON public.tracking_links(tracking_code);
CREATE INDEX IF NOT EXISTS idx_tracking_links_linked ON public.tracking_links(linked_type, linked_id);
CREATE INDEX IF NOT EXISTS idx_tracking_links_carrier ON public.tracking_links(carrier);
CREATE INDEX IF NOT EXISTS idx_tracking_links_status ON public.tracking_links(status);

CREATE TRIGGER set_tracking_links_updated_at
BEFORE UPDATE ON public.tracking_links
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();