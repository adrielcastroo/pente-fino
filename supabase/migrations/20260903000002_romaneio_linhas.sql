-- Migration: Criar tabela para linhas do romaneio
CREATE TABLE IF NOT EXISTS romaneio_linhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  romaneio_id UUID NOT NULL REFERENCES romaneio_dias(id) ON DELETE CASCADE,
  codigo_cliente VARCHAR(50) NOT NULL,
  nome_cliente VARCHAR(255),
  quantidade INTEGER DEFAULT 1,
  modalidade_frete VARCHAR(50),
  transportadora VARCHAR(255),
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_romaneio_linhas_romaneio ON romaneio_linhas(romaneio_id);
CREATE INDEX IF NOT EXISTS idx_romaneio_linhas_cliente ON romaneio_linhas(codigo_cliente);

-- Comment
COMMENT ON TABLE romaneio_linhas IS 'Linhas/itens de cada romaneio diário';
