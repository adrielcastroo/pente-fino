CREATE TABLE public.transferencia_folha_processos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_externo text NOT NULL,
  observacao text,
  nr_portal text,
  situacao_importada text,
  qt_item numeric,
  dt_criacao date,
  usuario_criacao text,
  nr_entrada_sap text,
  etapa text NOT NULL DEFAULT 'pendente',
  entregue_em timestamptz,
  recebido_em timestamptz,
  finalizado_em timestamptz,
  lote_importacao uuid,
  importado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transferencia_folha_processos_etapa_check
    CHECK (etapa IN ('pendente','entregue_logistica','recebido_logistica','finalizada')),
  CONSTRAINT transferencia_folha_processos_id_externo_key UNIQUE (id_externo)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transferencia_folha_processos TO authenticated;
GRANT ALL ON public.transferencia_folha_processos TO service_role;

ALTER TABLE public.transferencia_folha_processos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem processos de folha"
  ON public.transferencia_folha_processos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados criam processos de folha"
  ON public.transferencia_folha_processos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados atualizam processos de folha"
  ON public.transferencia_folha_processos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gestores removem processos de folha"
  ON public.transferencia_folha_processos FOR DELETE TO authenticated
  USING (public.is_at_least('gerente'::public.app_role));

CREATE INDEX idx_tfp_etapa ON public.transferencia_folha_processos (etapa);
CREATE INDEX idx_tfp_lote ON public.transferencia_folha_processos (lote_importacao);

CREATE TRIGGER trg_tfp_updated_at
  BEFORE UPDATE ON public.transferencia_folha_processos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();