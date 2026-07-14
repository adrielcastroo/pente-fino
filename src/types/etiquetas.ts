/**
 * Tipos do módulo de Etiquetas de Expedição (arquitetura Bartender-style).
 */

export type CategoriaEtiqueta = 'expedicao' | 'conferencia' | 'devolucao' | 'custom';
export type TipoVariavel = 'text' | 'select' | 'date' | 'barcode' | 'qr' | 'auto';

export interface VariavelTemplate {
  chave: string;
  label: string;
  tipo: TipoVariavel;
  obrigatorio: boolean;
  padrao?: string;
  opcoes?: string[];
  validacao?: string;
  descricao?: string;
  placeholder?: string;
  ordem: number;
}

export interface DimensoesEtiqueta {
  largura: number;
  altura: number;
}

export interface EtiquetaTemplate {
  id: string;
  nome: string;
  categoria: CategoriaEtiqueta;
  dimensoes: DimensoesEtiqueta;
  zpl: string;
  variaveis: VariavelTemplate[];
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  versao: number;
  ativo: boolean;
}

export interface EtiquetaHistorico {
  id: string;
  template_id: string | null;
  template_nome: string;
  variaveis_usadas: Record<string, string>;
  quantidade: number;
  impressora: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  criado_em: string;
}

export interface CreateEtiquetaTemplateInput {
  nome: string;
  categoria: CategoriaEtiqueta;
  dimensoes: DimensoesEtiqueta;
  zpl: string;
  variaveis: VariavelTemplate[];
}

export interface ImprimirInput {
  templateId: string;
  variaveis: Record<string, string>;
  quantidade: number;
  impressora?: string;
}

export const PRESETS_TAMANHO = [
  { nome: 'Expedição Padrão', largura: 100, altura: 150, uso: 'Romaneio + cliente + código' },
  { nome: 'Etiqueta Caixa', largura: 100, altura: 100, uso: 'Código de barras grande' },
  { nome: 'Conferência', largura: 80, altura: 120, uso: 'Double-check' },
  { nome: 'Correios PAC/Sedex', largura: 100, altura: 150, uso: 'Layout Correios' },
  { nome: 'Personalizado', largura: 100, altura: 150, uso: 'Livre' },
] as const;

export interface VariavelInteligente {
  chave: string;
  label: string;
  tipo: TipoVariavel;
  desc: string;
  opcoes?: readonly string[];
  padrao?: string;
}

export const VARIAVEIS_INTELIGENTES: readonly VariavelInteligente[] = [
  { chave: 'nf', label: 'Nota Fiscal', tipo: 'text', desc: 'Número da NF (importado do XML)' },
  { chave: 'romaneio', label: 'Romaneio', tipo: 'text', desc: 'Número do romaneio (6 dígitos)' },
  { chave: 'transportadora', label: 'Transportadora', tipo: 'select', opcoes: ['JADLOG', 'CORREIOS', 'SEQUOIA', 'OUTRA'], desc: 'Transportadora' },
  { chave: 'volume_atual', label: 'Volume Atual', tipo: 'text', desc: 'Número do volume atual (ex: 03)' },
  { chave: 'volume_total', label: 'Volume Total', tipo: 'text', desc: 'Total de volumes (ex: 12)' },
  { chave: 'data', label: 'Data de Emissão', tipo: 'date', padrao: '{{hoje}}', desc: 'Data de emissão' },
  { chave: 'logo', label: 'Logo (imagem)', tipo: 'auto', desc: 'Logo importada via upload — renderiza como imagem' },
];

// Etiqueta PADRÃO ÚNICO de Expedição (100x50mm — 480x400 dots @ 203dpi)
// Layout: LOGO (imagem) no topo · TRANSPORTADORA centralizada · QR Code central ·
// NF abaixo do QR · VOLUME atual / total · DATA de emissão no canto inferior direito.
export const ZPL_PADRAO = `^XA
^PW480
^LL400
^LH0,0
^CI28
^FX =============================== LOGO (imagem via upload)
^FO136,0^A0N,52,52^FD{{logo}}^FS
^FX =============================== TRANSPORTADORA
^FO27,89^A0N,20,20^FR^FDTRANSPORTADORA:^FS
^FO47,136^FB440,1,0,C^A0N,28,28^FD{{transportadora}}^FS
^FX =============================== QR CODE CENTRAL
^FO297,136^BQN,2,4^FDLA,ROM{{romaneio}}^FS
^FX =============================== NF (abaixo do QR)
^FO299,89^FB440,1,0,C^A0N,25,25^FR^FDNF {{nf}}^FS
^FX =============================== VOLUME ATUAL / TOTAL
^FO68,298^A0N,50,50^FD{{volume_atual}}^FS
^FO228,298^A0N,45,45^FD/^FS
^FO316,298^A0N,50,50^FD{{volume_total}}^FS
^FO80,362^A0N,18,18^FDVOLUME^FS
^FO336,362^A0N,18,18^FDTOTAL^FS
^FX =============================== DATA EMISSAO (canto inferior direito)
^FO373,12^A0N,18,18^FD{{data}}^FS
^FO0,86^GB490,1,2^FS
^FO245,86^GB1,213,2^FS
^FO0,298^GB492,1,2^FS
^XZ`;

export const VARIAVEIS_PADRAO: VariavelTemplate[] = [
  { chave: 'nf', label: 'Nota Fiscal', tipo: 'text', obrigatorio: true, ordem: 0 },
  { chave: 'romaneio', label: 'Romaneio', tipo: 'text', obrigatorio: true, ordem: 1 },
  { chave: 'transportadora', label: 'Transportadora', tipo: 'select', obrigatorio: true, opcoes: ['JADLOG', 'CORREIOS', 'SEQUOIA', 'OUTRA'], ordem: 2 },
  { chave: 'volume_atual', label: 'Volume Atual', tipo: 'text', obrigatorio: true, ordem: 3 },
  { chave: 'volume_total', label: 'Volume Total', tipo: 'text', obrigatorio: true, ordem: 4 },
  { chave: 'data', label: 'Data de Emissão', tipo: 'date', obrigatorio: false, padrao: '{{hoje}}', ordem: 5 },
];
