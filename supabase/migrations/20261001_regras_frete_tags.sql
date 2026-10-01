-- Adiciona coluna de tags/pendências para regras de frete
ALTER TABLE faturamento_regras ADD COLUMN IF NOT EXISTS pendencias text[];

-- Adiciona índice para busca por pendências
CREATE INDEX IF NOT EXISTS idx_faturamento_regras_pendencias ON faturamento_regras USING GIN (pendencias);

-- Comment
COMMENT ON COLUMN faturamento_regras.pendencias IS 'Lista de tags indicando pendências: sem_cif, sem_fob, sem_minimo, sem_transportadora, cliente_balcão, cif_mal_formatado, fob_mal_formatado';
