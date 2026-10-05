
CREATE TABLE public.tecidos_sem_espaco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text NOT NULL,
  endereco_desejado text NOT NULL,
  estrutura text NOT NULL,
  coluna text NOT NULL,
  nivel int NOT NULL,
  proc text,
  m_linear numeric,
  largura numeric,
  m2 numeric,
  lote text,
  lote_sistema text NOT NULL,
  auge_cd_item text,
  auge_cd_deposito text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tse_endereco ON public.tecidos_sem_espaco(estrutura, coluna, nivel);
CREATE INDEX idx_tse_synced_at ON public.tecidos_sem_espaco(synced_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tecidos_sem_espaco TO authenticated;
GRANT ALL ON public.tecidos_sem_espaco TO service_role;

ALTER TABLE public.tecidos_sem_espaco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver tecidos sem espaço"
  ON public.tecidos_sem_espaco FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem gerenciar tecidos sem espaço"
  ON public.tecidos_sem_espaco FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_tse_updated_at
  BEFORE UPDATE ON public.tecidos_sem_espaco
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: quando liberar posição em TECxx, realocar o mais antigo da fila
CREATE OR REPLACE FUNCTION public.realoc_tecido_sem_espaco()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_next_pos int;
BEGIN
  -- Só age se removeu/liberou posição de estrutura TEC
  IF OLD.estrutura NOT LIKE 'TEC%' THEN RETURN OLD; END IF;

  -- Pega o próximo da fila para o mesmo endereço
  SELECT * INTO v_pending
  FROM public.tecidos_sem_espaco
  WHERE estrutura = OLD.estrutura AND coluna = OLD.coluna AND nivel = OLD.nivel
  ORDER BY synced_at ASC
  LIMIT 1;

  IF NOT FOUND THEN RETURN OLD; END IF;

  -- Encontra próxima posição livre 1..30
  SELECT COALESCE(MIN(gs), 1) INTO v_next_pos
  FROM generate_series(1, 30) gs
  WHERE gs NOT IN (
    SELECT posicao FROM public.estoque_posicoes
    WHERE estrutura = OLD.estrutura AND coluna = OLD.coluna AND nivel = OLD.nivel
      AND status NOT IN ('saida','livre')
  );

  IF v_next_pos IS NULL OR v_next_pos > 30 THEN RETURN OLD; END IF;

  INSERT INTO public.estoque_posicoes
    (estrutura, coluna, nivel, posicao, status, item, m2, largura, m_linear, lote, endereco, lote_sistema, conferente_entrada, data_registro)
  VALUES
    (v_pending.estrutura, v_pending.coluna, v_pending.nivel, v_next_pos, 'ocupado',
     v_pending.item, v_pending.m2, v_pending.largura, v_pending.m_linear,
     v_pending.lote, v_pending.endereco_desejado, v_pending.lote_sistema,
     'Importado Auge', v_pending.synced_at);

  DELETE FROM public.tecidos_sem_espaco WHERE id = v_pending.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_realoc_tecido
  AFTER DELETE ON public.estoque_posicoes
  FOR EACH ROW EXECUTE FUNCTION public.realoc_tecido_sem_espaco();

CREATE TRIGGER trg_realoc_tecido_upd
  AFTER UPDATE OF status ON public.estoque_posicoes
  FOR EACH ROW
  WHEN (NEW.status IN ('saida','livre') AND OLD.status NOT IN ('saida','livre'))
  EXECUTE FUNCTION public.realoc_tecido_sem_espaco();
