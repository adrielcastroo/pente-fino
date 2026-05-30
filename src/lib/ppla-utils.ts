
export interface PPLALabelData {
  item: string;
  descricao?: string;
  lote: string;
  nf?: string;
  processo?: string;
  m_linear?: string;
  endereco?: string;
}

/**
 * Gera uma string de comandos PPLA para impressoras Argox
 * Baseado no layout solicitado: Descrição no topo, SKU/Lote no meio, QR Code na lateral.
 */
export const generatePPLA = (data: PPLALabelData): string => {
  const { item, descricao = '', lote, nf, processo, m_linear, endereco } = data;
  
  // L: Início do formato de etiqueta
  // D11: Define densidade de pontos
  // H10: Define temperatura de aquecimento (0-20)
  // S2: Velocidade de impressão
  // 1: Unidades em mm
  
  let ppla = '\x02L\r'; // Start of label
  ppla += 'D11\r';
  ppla += 'H10\r';
  
  // Texto: Descrição (Topo)
  // 1: Fonte (1-9)
  // 9: Multiplicador horizontal
  // 1: Multiplicador vertical
  // 000: Orientação
  // 000: Posição X (em mm ou pontos dependendo da config)
  // 010: Posição Y
  ppla += `191100000000050${descricao.slice(0, 40)}\r`;
  
  // SKU/Item
  ppla += `191100000000100SKU: ${item}\r`;
  
  // Lote e NF/Processo
  const infoLinha2 = `LOTE: ${lote} ${nf ? 'NF: ' + nf : ''} ${processo ? 'PR: ' + processo : ''}`;
  ppla += `191100000000150${infoLinha2.slice(0, 40)}\r`;
  
  // Metragem e Endereço
  const infoLinha3 = `${m_linear ? m_linear + 'M' : ''} ${endereco ? '@' + endereco : ''}`;
  ppla += `191100000000200${infoLinha3}\r`;

  // QR Code
  // 1X11: Comando para QR Code
  // 000: Posição X
  // 250: Posição Y (Lateral)
  const qrContent = `SKU:${item};LOTE:${lote}`;
  ppla += `1X1100004500100${qrContent}\r`;
  
  ppla += 'E\r'; // End of label
  ppla += '\x02G\r'; // Start printing
  
  return ppla;
};
