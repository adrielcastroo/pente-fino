
-- Fase 0.4 — Validações de Negócio (ajustado ao schema real)

-- 1) Conferência vazia: bloquear finished_at quando não há registros
CREATE OR REPLACE FUNCTION public.prevent_empty_conference_close()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL
     AND (OLD.finished_at IS DISTINCT FROM NEW.finished_at) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.registros WHERE conference_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Não é possível fechar uma conferência sem registros.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_empty_conference_close ON public.conferences;
CREATE TRIGGER trg_prevent_empty_conference_close
BEFORE UPDATE ON public.conferences
FOR EACH ROW EXECUTE FUNCTION public.prevent_empty_conference_close();

-- 2) Saída exige responsável (conferente_saida) e data_saida
ALTER TABLE public.estoque_saidas
  ADD CONSTRAINT estoque_saidas_conferente_saida_not_blank
  CHECK (conferente_saida IS NOT NULL AND length(trim(conferente_saida)) > 0)
  NOT VALID;

ALTER TABLE public.estoque_saidas
  ADD CONSTRAINT estoque_saidas_data_saida_required
  CHECK (data_saida IS NOT NULL)
  NOT VALID;

-- 3) Quantidades não-negativas
ALTER TABLE public.registros
  ADD CONSTRAINT registros_quantidade_nonneg CHECK (quantidade IS NULL OR quantidade >= 0) NOT VALID,
  ADD CONSTRAINT registros_m2_nonneg          CHECK (m2 IS NULL OR m2 >= 0)               NOT VALID,
  ADD CONSTRAINT registros_mlinear_nonneg     CHECK (m_linear IS NULL OR m_linear >= 0)   NOT VALID,
  ADD CONSTRAINT registros_largura_nonneg     CHECK (largura IS NULL OR largura >= 0)     NOT VALID;

ALTER TABLE public.estoque_posicoes
  ADD CONSTRAINT estoque_posicoes_m2_nonneg       CHECK (m2 IS NULL OR m2 >= 0)             NOT VALID,
  ADD CONSTRAINT estoque_posicoes_mlinear_nonneg  CHECK (m_linear IS NULL OR m_linear >= 0) NOT VALID,
  ADD CONSTRAINT estoque_posicoes_largura_nonneg  CHECK (largura IS NULL OR largura >= 0)   NOT VALID;

ALTER TABLE public.estoque_saidas
  ADD CONSTRAINT estoque_saidas_m2_positive       CHECK (m2 IS NULL OR m2 > 0)             NOT VALID,
  ADD CONSTRAINT estoque_saidas_mlinear_positive  CHECK (m_linear IS NULL OR m_linear > 0) NOT VALID;
