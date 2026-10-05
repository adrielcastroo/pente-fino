
-- ============================================================================
-- Turno 1 — Reformulação Expedição: fluxo peça → etiqueta → carrinho → 
-- double-check → romaneio → NF
-- ============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.expedicao_peca_status AS ENUM (
    'etiquetada','no_carrinho','conferida','no_romaneio','faturada','cancelada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expedicao_carrinho_status_v2 AS ENUM (
    'montando','aguardando_conferencia','em_conferencia','conferido','romaneio_gerado','livre'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expedicao_romaneio_status AS ENUM (
    'aberto','faturado','cancelado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expedicao_regra_nf AS ENUM ('uma_nf','multiplas_nf');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Colunas novas em transportadoras
ALTER TABLE public.expedicao_transportadoras
  ADD COLUMN IF NOT EXISTS regra_nf public.expedicao_regra_nf NOT NULL DEFAULT 'uma_nf';

-- Colunas novas em carrinhos
ALTER TABLE public.expedicao_carrinhos
  ADD COLUMN IF NOT EXISTS conferente_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS transportadora_id uuid REFERENCES public.expedicao_transportadoras(id),
  ADD COLUMN IF NOT EXISTS aguardando_desde timestamptz,
  ADD COLUMN IF NOT EXISTS conferido_at timestamptz;

-- ==================== ROMANEIOS ====================
CREATE TABLE IF NOT EXISTS public.expedicao_romaneios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  transportadora_id uuid REFERENCES public.expedicao_transportadoras(id),
  status public.expedicao_romaneio_status NOT NULL DEFAULT 'aberto',
  observacao text,
  created_by uuid REFERENCES auth.users(id),
  faturado_at timestamptz,
  cancelado_at timestamptz,
  cancelado_por uuid REFERENCES auth.users(id),
  motivo_cancelamento text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_romaneios TO authenticated;
GRANT ALL ON public.expedicao_romaneios TO service_role;
ALTER TABLE public.expedicao_romaneios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao romaneios select" ON public.expedicao_romaneios FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao romaneios insert" ON public.expedicao_romaneios FOR INSERT TO authenticated WITH CHECK (public.has_module('expedicao'));
CREATE POLICY "expedicao romaneios update" ON public.expedicao_romaneios FOR UPDATE TO authenticated USING (public.has_module('expedicao')) WITH CHECK (public.has_module('expedicao'));
CREATE POLICY "expedicao romaneios delete" ON public.expedicao_romaneios FOR DELETE TO authenticated USING (public.expedicao_has_at_least('supervisor'));
CREATE INDEX IF NOT EXISTS idx_exp_romaneios_status ON public.expedicao_romaneios(status);
CREATE INDEX IF NOT EXISTS idx_exp_romaneios_transp ON public.expedicao_romaneios(transportadora_id);
CREATE TRIGGER trg_exp_romaneios_updated_at BEFORE UPDATE ON public.expedicao_romaneios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== PEÇAS ====================
CREATE TABLE IF NOT EXISTS public.expedicao_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_etiqueta text NOT NULL UNIQUE,
  codigo_peca text,
  descricao text,
  status public.expedicao_peca_status NOT NULL DEFAULT 'etiquetada',
  embalador_id uuid REFERENCES auth.users(id),
  carrinho_id uuid REFERENCES public.expedicao_carrinhos(id) ON DELETE SET NULL,
  romaneio_id uuid REFERENCES public.expedicao_romaneios(id) ON DELETE SET NULL,
  conferente_id uuid REFERENCES auth.users(id),
  etiquetada_at timestamptz NOT NULL DEFAULT now(),
  alocada_at timestamptz,
  conferida_at timestamptz,
  faturada_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_pecas TO authenticated;
GRANT ALL ON public.expedicao_pecas TO service_role;
ALTER TABLE public.expedicao_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao pecas select" ON public.expedicao_pecas FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao pecas insert" ON public.expedicao_pecas FOR INSERT TO authenticated WITH CHECK (public.has_module('expedicao'));
CREATE POLICY "expedicao pecas update" ON public.expedicao_pecas FOR UPDATE TO authenticated USING (public.has_module('expedicao')) WITH CHECK (public.has_module('expedicao'));
CREATE POLICY "expedicao pecas delete" ON public.expedicao_pecas FOR DELETE TO authenticated USING (public.expedicao_has_at_least('supervisor'));
CREATE INDEX IF NOT EXISTS idx_exp_pecas_status ON public.expedicao_pecas(status);
CREATE INDEX IF NOT EXISTS idx_exp_pecas_carrinho ON public.expedicao_pecas(carrinho_id);
CREATE INDEX IF NOT EXISTS idx_exp_pecas_romaneio ON public.expedicao_pecas(romaneio_id);
CREATE INDEX IF NOT EXISTS idx_exp_pecas_etiqueta ON public.expedicao_pecas(codigo_etiqueta);
CREATE TRIGGER trg_exp_pecas_updated_at BEFORE UPDATE ON public.expedicao_pecas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== ROMANEIO x NFE (N:N) ====================
CREATE TABLE IF NOT EXISTS public.expedicao_romaneio_nfe (
  romaneio_id uuid NOT NULL REFERENCES public.expedicao_romaneios(id) ON DELETE CASCADE,
  nfe_id uuid NOT NULL REFERENCES public.nfe_importadas(id) ON DELETE CASCADE,
  vinculada_at timestamptz NOT NULL DEFAULT now(),
  vinculada_por uuid REFERENCES auth.users(id),
  PRIMARY KEY (romaneio_id, nfe_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_romaneio_nfe TO authenticated;
GRANT ALL ON public.expedicao_romaneio_nfe TO service_role;
ALTER TABLE public.expedicao_romaneio_nfe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao romaneio_nfe select" ON public.expedicao_romaneio_nfe FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao romaneio_nfe insert" ON public.expedicao_romaneio_nfe FOR INSERT TO authenticated WITH CHECK (public.has_module('expedicao'));
CREATE POLICY "expedicao romaneio_nfe delete" ON public.expedicao_romaneio_nfe FOR DELETE TO authenticated USING (public.expedicao_has_at_least('supervisor'));
CREATE INDEX IF NOT EXISTS idx_exp_rom_nfe_nfe ON public.expedicao_romaneio_nfe(nfe_id);

-- ==================== HISTÓRICO DE PEÇAS (rastreabilidade) ====================
CREATE TABLE IF NOT EXISTS public.expedicao_pecas_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peca_id uuid NOT NULL REFERENCES public.expedicao_pecas(id) ON DELETE CASCADE,
  acao text NOT NULL, -- etiquetar | alocar | transferir | conferir | erro_check | realocar | romaneio | faturar | cancelar
  usuario_id uuid REFERENCES auth.users(id),
  usuario_email text,
  carrinho_origem_id uuid,
  carrinho_destino_id uuid,
  romaneio_id uuid,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.expedicao_pecas_historico TO authenticated;
GRANT ALL ON public.expedicao_pecas_historico TO service_role;
ALTER TABLE public.expedicao_pecas_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao pecas_historico select" ON public.expedicao_pecas_historico FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao pecas_historico insert" ON public.expedicao_pecas_historico FOR INSERT TO authenticated WITH CHECK (public.has_module('expedicao'));
CREATE INDEX IF NOT EXISTS idx_exp_pecas_hist_peca ON public.expedicao_pecas_historico(peca_id);
CREATE INDEX IF NOT EXISTS idx_exp_pecas_hist_acao ON public.expedicao_pecas_historico(acao);
CREATE INDEX IF NOT EXISTS idx_exp_pecas_hist_created ON public.expedicao_pecas_historico(created_at DESC);

-- ==================== CONFERÊNCIA — ITENS BIPADOS ====================
CREATE TABLE IF NOT EXISTS public.expedicao_conferencias_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrinho_id uuid NOT NULL REFERENCES public.expedicao_carrinhos(id) ON DELETE CASCADE,
  peca_id uuid REFERENCES public.expedicao_pecas(id) ON DELETE SET NULL,
  codigo_bipado text NOT NULL,
  resultado text NOT NULL CHECK (resultado IN ('ok','erro_outro_carrinho','erro_nao_encontrada','realocada')),
  conferente_id uuid REFERENCES auth.users(id),
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_conferencias_itens TO authenticated;
GRANT ALL ON public.expedicao_conferencias_itens TO service_role;
ALTER TABLE public.expedicao_conferencias_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao conf_itens select" ON public.expedicao_conferencias_itens FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao conf_itens insert" ON public.expedicao_conferencias_itens FOR INSERT TO authenticated WITH CHECK (public.has_module('expedicao'));
CREATE POLICY "expedicao conf_itens delete" ON public.expedicao_conferencias_itens FOR DELETE TO authenticated USING (public.expedicao_has_at_least('supervisor'));
CREATE INDEX IF NOT EXISTS idx_exp_conf_carrinho ON public.expedicao_conferencias_itens(carrinho_id);
CREATE INDEX IF NOT EXISTS idx_exp_conf_peca ON public.expedicao_conferencias_itens(peca_id);
