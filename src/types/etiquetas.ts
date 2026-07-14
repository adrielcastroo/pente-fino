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
  { chave: 'romaneio', label: 'Romaneio', tipo: 'text', desc: 'Número do romaneio' },
  { chave: 'cliente', label: 'Cliente', tipo: 'text', desc: 'Nome do cliente' },
  { chave: 'nf', label: 'Nota Fiscal', tipo: 'text', desc: 'Nota fiscal' },
  { chave: 'transportadora', label: 'Transportadora', tipo: 'select', opcoes: ['Jadlog', 'Correios', 'Sequoia', 'Outra'], desc: 'Transportadora' },
  { chave: 'data', label: 'Data', tipo: 'date', padrao: '{{hoje}}', desc: 'Data' },
  { chave: 'peso', label: 'Peso (kg)', tipo: 'text', desc: 'Peso calculado' },
  { chave: 'volume', label: 'Volume (m³)', tipo: 'text', desc: 'Volume da caixa' },
  { chave: 'endereco', label: 'Endereço', tipo: 'text', desc: 'Endereço completo' },
  { chave: 'codigo_barras', label: 'Código de Barras', tipo: 'barcode', desc: 'CODE128 automático' },
  { chave: 'qr_code', label: 'QR Code', tipo: 'qr', desc: 'QR com JSON' },
  { chave: 'pedido', label: 'Pedido', tipo: 'text', desc: 'Número do pedido' },
  { chave: 'item', label: 'Item/SKU', tipo: 'text', desc: 'Item/SKU' },
  { chave: 'quantidade', label: 'Quantidade', tipo: 'text', desc: 'Quantidade' },
  { chave: 'caixa', label: 'Caixa', tipo: 'text', desc: 'Número da caixa (1/3, 2/3)' },
];

export const ZPL_PADRAO = `^XA
^CI28
^FO40,40^A0N,40,40^FD{{cliente}}^FS
^FO40,90^A0N,28,28^FDRomaneio: {{romaneio}}^FS
^FO40,130^A0N,28,28^FDNF: {{nf}}^FS
^FO40,170^A0N,24,24^FDData: {{data}}^FS
^FO40,210^A0N,24,24^FDTransp: {{transportadora}}^FS
^FO40,260^BY3^BCN,100,Y,N,N^FD{{codigo_barras}}^FS
^XZ`;

export const VARIAVEIS_PADRAO: VariavelTemplate[] = [
  { chave: 'romaneio', label: 'Romaneio', tipo: 'text', obrigatorio: true, ordem: 0 },
  { chave: 'cliente', label: 'Cliente', tipo: 'text', obrigatorio: true, ordem: 1 },
  { chave: 'nf', label: 'Nota Fiscal', tipo: 'text', obrigatorio: false, ordem: 2 },
  { chave: 'data', label: 'Data', tipo: 'date', obrigatorio: false, padrao: '{{hoje}}', ordem: 3 },
  { chave: 'transportadora', label: 'Transportadora', tipo: 'select', obrigatorio: false, opcoes: ['Jadlog', 'Correios', 'Sequoia', 'Outra'], ordem: 4 },
  { chave: 'codigo_barras', label: 'Código de Barras', tipo: 'barcode', obrigatorio: false, ordem: 5 },
];
