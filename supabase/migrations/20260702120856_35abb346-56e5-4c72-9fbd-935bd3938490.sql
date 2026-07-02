
-- TMS Interno: veículos, cargas, comprovantes
CREATE TABLE public.expedicao_veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL UNIQUE,
  modelo TEXT,
  capacidade_kg NUMERIC,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_veiculos TO authenticated;
GRANT ALL ON public.expedicao_veiculos TO service_role;
ALTER TABLE public.expedicao_veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expedicao_veiculos_select" ON public.expedicao_veiculos FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "expedicao_veiculos_ins" ON public.expedicao_veiculos FOR INSERT TO authenticated WITH CHECK (public.expedicao_has_at_least('supervisor'));
CREATE POLICY "expedicao_veiculos_upd" ON public.expedicao_veiculos FOR UPDATE TO authenticated USING (public.expedicao_has_at_least('supervisor')) WITH CHECK (public.expedicao_has_at_least('supervisor'));
CREATE POLICY "expedicao_veiculos_del" ON public.expedicao_veiculos FOR DELETE TO authenticated USING (public.expedicao_has_at_least('gerente'));
CREATE TRIGGER trg_veiculos_updated BEFORE UPDATE ON public.expedicao_veiculos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.expedicao_cargas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  veiculo_id UUID REFERENCES public.expedicao_veiculos(id) ON DELETE SET NULL,
  motorista_nome TEXT,
  motorista_doc TEXT,
  data_coleta DATE,
  rota TEXT,
  status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada','em_transito','entregue','cancelada')),
  custo_frete NUMERIC DEFAULT 0,
  codigo_rastreio TEXT,
  transportadora_tipo TEXT CHECK (transportadora_tipo IN ('correios','jadlog','total','outro')),
  observacao TEXT,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_cargas_status ON public.expedicao_cargas(status);
CREATE INDEX ix_cargas_veiculo ON public.expedicao_cargas(veiculo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_cargas TO authenticated;
GRANT ALL ON public.expedicao_cargas TO service_role;
ALTER TABLE public.expedicao_cargas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cargas_select" ON public.expedicao_cargas FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "cargas_ins" ON public.expedicao_cargas FOR INSERT TO authenticated WITH CHECK (public.expedicao_has_at_least('operador'));
CREATE POLICY "cargas_upd" ON public.expedicao_cargas FOR UPDATE TO authenticated USING (public.expedicao_has_at_least('operador')) WITH CHECK (public.expedicao_has_at_least('operador'));
CREATE POLICY "cargas_del" ON public.expedicao_cargas FOR DELETE TO authenticated USING (public.expedicao_has_at_least('gerente'));
CREATE TRIGGER trg_cargas_updated BEFORE UPDATE ON public.expedicao_cargas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.expedicao_carga_romaneios (
  carga_id UUID NOT NULL REFERENCES public.expedicao_cargas(id) ON DELETE CASCADE,
  romaneio_id UUID NOT NULL REFERENCES public.expedicao_romaneios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (carga_id, romaneio_id)
);
CREATE INDEX ix_carga_rom_rom ON public.expedicao_carga_romaneios(romaneio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_carga_romaneios TO authenticated;
GRANT ALL ON public.expedicao_carga_romaneios TO service_role;
ALTER TABLE public.expedicao_carga_romaneios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carga_rom_select" ON public.expedicao_carga_romaneios FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "carga_rom_ins" ON public.expedicao_carga_romaneios FOR INSERT TO authenticated WITH CHECK (public.expedicao_has_at_least('operador'));
CREATE POLICY "carga_rom_del" ON public.expedicao_carga_romaneios FOR DELETE TO authenticated USING (public.expedicao_has_at_least('operador'));

CREATE TABLE public.expedicao_comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id UUID NOT NULL REFERENCES public.expedicao_cargas(id) ON DELETE CASCADE,
  recebedor_nome TEXT,
  recebedor_doc TEXT,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  foto_path TEXT,
  assinatura_base64 TEXT,
  observacao TEXT,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_comprov_carga ON public.expedicao_comprovantes(carga_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_comprovantes TO authenticated;
GRANT ALL ON public.expedicao_comprovantes TO service_role;
ALTER TABLE public.expedicao_comprovantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comprov_select" ON public.expedicao_comprovantes FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "comprov_ins" ON public.expedicao_comprovantes FOR INSERT TO authenticated WITH CHECK (public.expedicao_has_at_least('operador'));
CREATE POLICY "comprov_upd" ON public.expedicao_comprovantes FOR UPDATE TO authenticated USING (public.expedicao_has_at_least('supervisor')) WITH CHECK (public.expedicao_has_at_least('supervisor'));
CREATE POLICY "comprov_del" ON public.expedicao_comprovantes FOR DELETE TO authenticated USING (public.expedicao_has_at_least('gerente'));

-- Rastreio: cache de eventos
CREATE TABLE public.expedicao_rastreio_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id UUID NOT NULL REFERENCES public.expedicao_cargas(id) ON DELETE CASCADE,
  data_evento TIMESTAMPTZ NOT NULL,
  status TEXT,
  local TEXT,
  descricao TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (carga_id, data_evento, status)
);
CREATE INDEX ix_rastreio_carga ON public.expedicao_rastreio_eventos(carga_id, data_evento DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedicao_rastreio_eventos TO authenticated;
GRANT ALL ON public.expedicao_rastreio_eventos TO service_role;
ALTER TABLE public.expedicao_rastreio_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rastreio_select" ON public.expedicao_rastreio_eventos FOR SELECT TO authenticated USING (public.has_module('expedicao'));
CREATE POLICY "rastreio_ins" ON public.expedicao_rastreio_eventos FOR INSERT TO authenticated WITH CHECK (public.expedicao_has_at_least('operador'));
CREATE POLICY "rastreio_del" ON public.expedicao_rastreio_eventos FOR DELETE TO authenticated USING (public.expedicao_has_at_least('supervisor'));
