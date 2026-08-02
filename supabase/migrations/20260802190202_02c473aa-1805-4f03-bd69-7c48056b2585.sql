ALTER TABLE public.compras_pedidos
ADD COLUMN IF NOT EXISTS nf_emitida TEXT,
ADD COLUMN IF NOT EXISTS nf_retorno TEXT;

-- Grant access to existing roles (redundant if already granted to ALL, but safe for newly added columns if RLS was tight)
GRANT UPDATE(nf_emitida, nf_retorno) ON public.compras_pedidos TO authenticated;
GRANT SELECT ON public.compras_pedidos TO authenticated;
