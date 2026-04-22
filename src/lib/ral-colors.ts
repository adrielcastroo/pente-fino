// RAL Classic color palette (subset of most-used industrial/architectural colors)
// Source: RAL CLASSIC system. Used as reference base for "Lotes Mestres" tonalities.
export interface RalColor {
  code: string;        // e.g. "RAL 9010"
  name: string;        // PT-BR friendly name
  hex: string;         // approximate sRGB hex
  family: 'Branco' | 'Cinza' | 'Preto' | 'Bege' | 'Marrom' | 'Amarelo' | 'Laranja' | 'Vermelho' | 'Rosa' | 'Violeta' | 'Azul' | 'Verde';
}

export const RAL_COLORS: RalColor[] = [
  // Brancos / Cinzas claros
  { code: 'RAL 9010', name: 'Branco Puro', hex: '#f1ece1', family: 'Branco' },
  { code: 'RAL 9016', name: 'Branco Tráfego', hex: '#f1f0ea', family: 'Branco' },
  { code: 'RAL 9003', name: 'Branco Sinalização', hex: '#f4f4f4', family: 'Branco' },
  { code: 'RAL 9001', name: 'Branco Creme', hex: '#fdf4e3', family: 'Branco' },
  { code: 'RAL 9002', name: 'Branco Acinzentado', hex: '#e7ebda', family: 'Branco' },
  { code: 'RAL 9018', name: 'Branco Papyrus', hex: '#cfd3cd', family: 'Branco' },
  { code: 'RAL 1013', name: 'Branco Pérola', hex: '#eae6ca', family: 'Branco' },
  { code: 'RAL 1015', name: 'Marfim Claro', hex: '#e6d2b5', family: 'Bege' },
  { code: 'RAL 1014', name: 'Marfim', hex: '#dfcea1', family: 'Bege' },
  // Bege / Marrom
  { code: 'RAL 1001', name: 'Bege', hex: '#cdba88', family: 'Bege' },
  { code: 'RAL 1011', name: 'Bege Marrom', hex: '#a78b4a', family: 'Bege' },
  { code: 'RAL 8001', name: 'Marrom Ocre', hex: '#9d622b', family: 'Marrom' },
  { code: 'RAL 8002', name: 'Marrom Sinal', hex: '#8e402a', family: 'Marrom' },
  { code: 'RAL 8003', name: 'Marrom Argila', hex: '#815a35', family: 'Marrom' },
  { code: 'RAL 8004', name: 'Marrom Cobre', hex: '#a5532a', family: 'Marrom' },
  { code: 'RAL 8011', name: 'Marrom Castanho', hex: '#5a3a29', family: 'Marrom' },
  { code: 'RAL 8014', name: 'Marrom Sépia', hex: '#4a3526', family: 'Marrom' },
  { code: 'RAL 8017', name: 'Marrom Chocolate', hex: '#44322d', family: 'Marrom' },
  { code: 'RAL 8019', name: 'Marrom Acinzentado', hex: '#3d3635', family: 'Marrom' },
  { code: 'RAL 8024', name: 'Marrom Bege', hex: '#79553c', family: 'Marrom' },
  { code: 'RAL 8025', name: 'Marrom Pálido', hex: '#755c48', family: 'Marrom' },
  { code: 'RAL 8028', name: 'Marrom Terra', hex: '#513a2a', family: 'Marrom' },
  // Cinzas
  { code: 'RAL 7035', name: 'Cinza Claro', hex: '#cbd0cc', family: 'Cinza' },
  { code: 'RAL 7032', name: 'Cinza Seixo', hex: '#b8b09d', family: 'Cinza' },
  { code: 'RAL 7038', name: 'Cinza Ágata', hex: '#b3b5b1', family: 'Cinza' },
  { code: 'RAL 7044', name: 'Cinza Seda', hex: '#cac4b0', family: 'Cinza' },
  { code: 'RAL 7047', name: 'Cinza Telegris 4', hex: '#cdcdcd', family: 'Cinza' },
  { code: 'RAL 7037', name: 'Cinza Poeira', hex: '#7d7f7d', family: 'Cinza' },
  { code: 'RAL 7042', name: 'Cinza Tráfego A', hex: '#8f9695', family: 'Cinza' },
  { code: 'RAL 7016', name: 'Cinza Antracite', hex: '#293133', family: 'Cinza' },
  { code: 'RAL 7021', name: 'Cinza Negro', hex: '#23282b', family: 'Cinza' },
  { code: 'RAL 7024', name: 'Cinza Grafite', hex: '#474a51', family: 'Cinza' },
  { code: 'RAL 7012', name: 'Cinza Basalto', hex: '#4d5645', family: 'Cinza' },
  { code: 'RAL 7011', name: 'Cinza Ferro', hex: '#3e4347', family: 'Cinza' },
  // Pretos
  { code: 'RAL 9005', name: 'Preto Profundo', hex: '#0a0a0a', family: 'Preto' },
  { code: 'RAL 9011', name: 'Preto Grafite', hex: '#1c1c1c', family: 'Preto' },
  { code: 'RAL 9017', name: 'Preto Tráfego', hex: '#1e1e1e', family: 'Preto' },
  // Amarelos
  { code: 'RAL 1003', name: 'Amarelo Sinal', hex: '#f7ba0b', family: 'Amarelo' },
  { code: 'RAL 1018', name: 'Amarelo Zinco', hex: '#f8f32b', family: 'Amarelo' },
  { code: 'RAL 1023', name: 'Amarelo Tráfego', hex: '#f0d22a', family: 'Amarelo' },
  { code: 'RAL 1021', name: 'Amarelo Colza', hex: '#eecb1a', family: 'Amarelo' },
  // Laranjas
  { code: 'RAL 2003', name: 'Laranja Pastel', hex: '#f6792d', family: 'Laranja' },
  { code: 'RAL 2004', name: 'Laranja Puro', hex: '#e25303', family: 'Laranja' },
  { code: 'RAL 2008', name: 'Laranja Vermelho', hex: '#f44611', family: 'Laranja' },
  // Vermelhos
  { code: 'RAL 3000', name: 'Vermelho Fogo', hex: '#af2b1e', family: 'Vermelho' },
  { code: 'RAL 3003', name: 'Vermelho Rubi', hex: '#9b111e', family: 'Vermelho' },
  { code: 'RAL 3020', name: 'Vermelho Tráfego', hex: '#cc0605', family: 'Vermelho' },
  { code: 'RAL 3013', name: 'Vermelho Tomate', hex: '#9c322e', family: 'Vermelho' },
  // Rosas
  { code: 'RAL 3015', name: 'Rosa Claro', hex: '#d36e70', family: 'Rosa' },
  { code: 'RAL 4003', name: 'Rosa Erica', hex: '#c63678', family: 'Rosa' },
  // Violetas
  { code: 'RAL 4005', name: 'Violeta Lilás', hex: '#6d3f5b', family: 'Violeta' },
  { code: 'RAL 4007', name: 'Púrpura Violeta', hex: '#4a203b', family: 'Violeta' },
  // Azuis
  { code: 'RAL 5002', name: 'Azul Ultramar', hex: '#20214f', family: 'Azul' },
  { code: 'RAL 5003', name: 'Azul Safira', hex: '#1d1e33', family: 'Azul' },
  { code: 'RAL 5005', name: 'Azul Sinal', hex: '#005387', family: 'Azul' },
  { code: 'RAL 5010', name: 'Azul Genciana', hex: '#0e294b', family: 'Azul' },
  { code: 'RAL 5012', name: 'Azul Claro', hex: '#3473ba', family: 'Azul' },
  { code: 'RAL 5015', name: 'Azul Céu', hex: '#1f6a93', family: 'Azul' },
  { code: 'RAL 5017', name: 'Azul Tráfego', hex: '#063971', family: 'Azul' },
  { code: 'RAL 5024', name: 'Azul Pastel', hex: '#5d9b9b', family: 'Azul' },
  // Verdes
  { code: 'RAL 6005', name: 'Verde Musgo', hex: '#114232', family: 'Verde' },
  { code: 'RAL 6011', name: 'Verde Reseda', hex: '#587246', family: 'Verde' },
  { code: 'RAL 6018', name: 'Verde Amarelado', hex: '#57a639', family: 'Verde' },
  { code: 'RAL 6021', name: 'Verde Pálido', hex: '#89ac76', family: 'Verde' },
  { code: 'RAL 6029', name: 'Verde Menta', hex: '#20603d', family: 'Verde' },
  { code: 'RAL 6019', name: 'Verde Pastel', hex: '#bdecb6', family: 'Verde' },
];

export function findRalByHex(hex: string): RalColor | undefined {
  if (!hex) return undefined;
  const norm = hex.toLowerCase();
  return RAL_COLORS.find(r => r.hex.toLowerCase() === norm);
}

export function findRalByCode(code: string): RalColor | undefined {
  if (!code) return undefined;
  const norm = code.trim().toUpperCase();
  return RAL_COLORS.find(r => r.code.toUpperCase() === norm);
}
