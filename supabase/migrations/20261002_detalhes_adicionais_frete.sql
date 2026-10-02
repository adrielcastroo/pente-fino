-- Adiciona coluna de detalhes adicionais para regras de frete
ALTER TABLE faturamento_regras ADD COLUMN IF NOT EXISTS detalhes_adicionais text;
COMMENT ON COLUMN faturamento_regras.detalhes_adicionais IS 'Informações adicionais do cliente extraídas da planilha de regras de frete';
