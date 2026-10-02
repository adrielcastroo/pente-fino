-- Adiciona coluna de detalhes adicionais para regras de frete
ALTER TABLE faturamento_regras ADD COLUMN IF NOT EXISTS detalhes_adicionais text;