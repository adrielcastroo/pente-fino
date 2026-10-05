CREATE INDEX IF NOT EXISTS idx_conferences_created_at ON public.conferences (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON public.operation_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_endereco_created_at ON public.movimentacoes_endereco (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfe_importadas_created_at ON public.nfe_importadas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_contagens_created_at ON public.historico_contagens (created_at DESC);