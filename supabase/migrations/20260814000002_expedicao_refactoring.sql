-- 1. Estruturas Temporárias (Pulmão)
CREATE TABLE public.expedicao_estruturas_temporarias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    descricao text,
    capacidade int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.expedicao_estruturas_temporarias TO authenticated;
GRANT ALL ON public.expedicao_estruturas_temporarias TO service_role;
ALTER TABLE public.expedicao_estruturas_temporarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para autenticados" ON public.expedicao_estruturas_temporarias FOR SELECT TO authenticated USING (true);

-- 2. Evolução da Tabela expedicao_pecas
ALTER TABLE public.expedicao_pecas 
ADD COLUMN IF NOT EXISTS pedido_id text,
ADD COLUMN IF NOT EXISTS item_pedido_id text,
ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.auge_clientes(id),
ADD COLUMN IF NOT EXISTS picking_id uuid REFERENCES public.expedicao_pickings(id),
ADD COLUMN IF NOT EXISTS estrutura_temporaria_id uuid REFERENCES public.expedicao_estruturas_temporarias(id);

-- 3. Histórico de Eventos Operacionais (mais robusto que a antiga expedicao_pecas_historico)
CREATE TABLE public.expedicao_eventos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    peca_id uuid REFERENCES public.expedicao_pecas(id) ON DELETE CASCADE,
    estado_anterior text,
    estado_novo text NOT NULL,
    operador_id uuid REFERENCES auth.users(id),
    detalhes jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT ON public.expedicao_eventos TO authenticated;
GRANT ALL ON public.expedicao_eventos TO service_role;
ALTER TABLE public.expedicao_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operadores podem inserir eventos" ON public.expedicao_eventos FOR INSERT TO authenticated WITH CHECK (auth.uid() = operador_id);
CREATE POLICY "Visualização para autenticados" ON public.expedicao_eventos FOR SELECT TO authenticated USING (true);

-- 4. Função para Registrar Mudança de Estado (Audit)
CREATE OR REPLACE FUNCTION public.fn_registrar_evento_expedicao()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR (TG_OP = 'INSERT') THEN
        INSERT INTO public.expedicao_eventos (peca_id, estado_anterior, estado_novo, detalhes)
        VALUES (NEW.id, CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END, NEW.status, 
                jsonb_build_object('op', TG_OP, 'ts', now()));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_registrar_evento_expedicao
AFTER INSERT OR UPDATE ON public.expedicao_pecas
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_evento_expedicao();

-- 5. Seed básico de estruturas temporárias
INSERT INTO public.expedicao_estruturas_temporarias (codigo, descricao, capacidade)
VALUES 
('PULMAO-A', 'Prateleira de Recebimento A', 100),
('PULMAO-B', 'Prateleira de Recebimento B', 100)
ON CONFLICT (codigo) DO NOTHING;
