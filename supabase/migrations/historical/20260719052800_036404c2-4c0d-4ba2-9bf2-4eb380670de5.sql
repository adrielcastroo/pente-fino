UPDATE public.auge_transferencias
SET
  documento = COALESCE(
    NULLIF(documento, ''),
    NULLIF(raw->>'cdTransferenciaEstoque', ''),
    NULLIF(raw->>'nrTransferencia', ''),
    CASE
      WHEN COALESCE(raw->>'idTipoDocumento', '') <> 'SAP'
        THEN NULLIF(raw->>'cdMovEstoqueERP', '')
      ELSE NULL
    END
  ),
  nr_efetivacao = COALESCE(
    NULLIF(nr_efetivacao, ''),
    NULLIF(raw->>'nrTransfEstoqueERP', ''),
    CASE
      WHEN COALESCE(raw->>'idTipoDocumento', '') = 'SAP'
        THEN NULLIF(raw->>'cdMovEstoqueERP', '')
      ELSE NULL
    END
  ),
  observacao = COALESCE(NULLIF(observacao, ''), NULLIF(raw->>'dsObservacao', ''), NULLIF(raw->>'dsObs', '')),
  updated_at = now()
WHERE raw IS NOT NULL
  AND (
    documento IS NULL OR documento = '' OR
    nr_efetivacao IS NULL OR nr_efetivacao = '' OR
    observacao IS NULL OR observacao = ''
  );

CREATE INDEX IF NOT EXISTS idx_auge_transferencias_detalhe_pendente
  ON public.auge_transferencias (detalhe_sincronizado_em, data_movimento DESC)
  WHERE detalhe_sincronizado_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_auge_transferencias_raw_tipo_doc
  ON public.auge_transferencias ((raw->>'idTipoDocumento'));