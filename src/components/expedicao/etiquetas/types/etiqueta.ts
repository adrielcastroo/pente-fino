// ============================================================================
// Tipos compartilhados da nova arquitetura de etiquetas (Print-First).
// ============================================================================
import type { BarcodeFmt } from '@/pages/expedicao/etiqueta-helpers';

export type { BarcodeFmt };
export type PrintMethod = 'browser' | 'zpl-usb' | 'zpl-serial';

export interface Vars {
  [key: string]: string;
}

/** Modelo simplificado de etiqueta usado pelo orquestrador Print-First. */
export interface Template {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  version: number;
  // dimensões
  widthMm: number;
  heightMm: number;
  // conteúdo
  titulo: string;
  subtitulo: string;
  codigo: string;
  destino: string;
  observacoes: string;
  customFields: { label: string; value: string }[];
  // códigos
  showQr: boolean;
  showBarcode: boolean;
  barcodeFmt: BarcodeFmt;
  payload: string;
  // layout
  copies: number;
  align: 'left' | 'center' | 'right';
  titleSize: number;
  codeSize: number;
  padding: number;
  borderStyle: 'none' | 'solid' | 'dashed';
  // variáveis específicas do template (sobrescrevem globais)
  templateVars: Vars;
  // BarTender opcional (imagem que substitui a etiqueta inteira)
  bartenderEnabled?: boolean;
  bartenderImageSrc?: string;
  // css custom @media print
  customCss?: string;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  patch: Partial<Template>;
  thumbnail?: string;
  builtIn?: boolean;
}

export interface PrintOptions {
  method?: PrintMethod;
  copies?: number;
  variables?: Vars;
  template?: Template;
}

export interface PrintResult {
  ok: boolean;
  method: PrintMethod;
  error?: string;
}

export interface BatchPrintResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface PickingLike {
  id: string;
  numero: string;
  cliente: string;
  nfe_numero?: string | null;
  transportadora?: { nome: string } | null;
  status: string;
}
