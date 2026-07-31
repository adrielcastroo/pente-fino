ALTER TABLE public.compras_pedidos
  ADD COLUMN IF NOT EXISTS titulo TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS ordem DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.compras_pedido_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.compras_pedidos(id) ON DELETE CASCADE,
  user_id UUID,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_pedido_comentarios TO authenticated;
GRANT ALL ON public.compras_pedido_comentarios TO service_role;
ALTER TABLE public.compras_pedido_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comentarios_select" ON public.compras_pedido_comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "comentarios_insert" ON public.compras_pedido_comentarios FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comentarios_update" ON public.compras_pedido_comentarios FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "comentarios_delete" ON public.compras_pedido_comentarios FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_cpc_pedido ON public.compras_pedido_comentarios(pedido_id);
CREATE TRIGGER trg_cpc_updated_at BEFORE UPDATE ON public.compras_pedido_comentarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.compras_pedido_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.compras_pedidos(id) ON DELETE CASCADE,
  user_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_pedido_anexos TO authenticated;
GRANT ALL ON public.compras_pedido_anexos TO service_role;
ALTER TABLE public.compras_pedido_anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anexos_select" ON public.compras_pedido_anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "anexos_insert" ON public.compras_pedido_anexos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "anexos_delete" ON public.compras_pedido_anexos FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_cpa_pedido ON public.compras_pedido_anexos(pedido_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.compras_pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compras_pedido_comentarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compras_pedido_anexos;