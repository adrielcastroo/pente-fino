-- Migration: Criar tabela para romaneios diários
CREATE TABLE IF NOT EXISTS romaneio_dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_romaneio DATE NOT NULL,
  titulo VARCHAR(255),
  status VARCHAR(50) DEFAULT 'rascunho',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_romaneio_dias_data ON romaneio_dias(data_romaneio);
CREATE INDEX IF NOT EXISTS idx_romaneio_dias_status ON romaneio_dias(status);

-- Comment
COMMENT ON TABLE romaneio_dias IS 'Romaneios diários importados do Excel';
