// ============================================================================
// Presets built-in + presets personalizados (localStorage).
// ============================================================================
import type { Preset, Template } from '../types/etiqueta';

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'correios-pac',
    label: 'Correios · PAC',
    description: '100×150 mm · CODE128 · destinatário em destaque',
    builtIn: true,
    patch: {
      widthMm: 100, heightMm: 150,
      titulo: 'CORREIOS · PAC', subtitulo: '{{romaneio}} · NF {{nf}}',
      codigo: '{{romaneio}}', destino: '{{cliente}}',
      showQr: false, showBarcode: true, barcodeFmt: 'CODE128',
      align: 'center', borderStyle: 'solid',
    },
  },
  {
    id: 'correios-sedex',
    label: 'Correios · SEDEX',
    description: '100×150 mm · QR + barras · prioridade',
    builtIn: true,
    patch: {
      widthMm: 100, heightMm: 150,
      titulo: 'SEDEX', subtitulo: 'Expressa · {{romaneio}}',
      codigo: '{{romaneio}}', destino: '{{cliente}}',
      showQr: true, showBarcode: true, barcodeFmt: 'CODE128',
      align: 'center', borderStyle: 'solid',
    },
  },
  {
    id: 'dhl',
    label: 'DHL Express',
    description: '100×150 mm · QR · internacional',
    builtIn: true,
    patch: {
      widthMm: 100, heightMm: 150,
      titulo: 'DHL EXPRESS', subtitulo: 'International · {{romaneio}}',
      codigo: '{{romaneio}}', destino: '{{cliente}}',
      showQr: true, showBarcode: false, barcodeFmt: 'CODE128',
      align: 'center', borderStyle: 'solid',
    },
  },
  {
    id: 'palete',
    label: 'Palete',
    description: '100×100 mm · ITF-14 · logística interna',
    builtIn: true,
    patch: {
      widthMm: 100, heightMm: 100,
      titulo: 'PALETE', subtitulo: 'Romaneio {{romaneio}}',
      codigo: '{{romaneio}}', destino: '{{cliente}}',
      showQr: false, showBarcode: true, barcodeFmt: 'ITF14',
      align: 'center', borderStyle: 'solid',
    },
  },
  {
    id: 'caixa-pequena',
    label: 'Caixa pequena',
    description: '60×40 mm · QR compacto',
    builtIn: true,
    patch: {
      widthMm: 60, heightMm: 40,
      titulo: '{{romaneio}}', subtitulo: '{{cliente}}',
      codigo: '{{romaneio}}', destino: '',
      showQr: true, showBarcode: false, barcodeFmt: 'CODE128',
      align: 'center', borderStyle: 'solid', titleSize: 14, codeSize: 10, padding: 2,
    },
  },
];

const CUSTOM_KEY = 'exp_etq_custom_presets_v1';

export function loadCustomPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export function saveCustomPresets(list: Preset[]): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

export function templateToPreset(t: Template, label: string, description = ''): Preset {
  const { id, name, createdAt, updatedAt, version, ...rest } = t;
  void id; void name; void createdAt; void updatedAt; void version;
  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    label,
    description: description || `Preset personalizado · ${rest.widthMm}×${rest.heightMm}mm`,
    patch: rest as Partial<Template>,
  };
}
