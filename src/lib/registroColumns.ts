import type { Registro } from '@/store/useAppStore';

export type RegistroMode = 'manual' | 'openrouter' | 'diversos';
export type RegistroColumnKey = 'item' | 'nf' | 'processo' | 'm2' | 'largura' | 'mLinear' | 'lote' | 'endereco' | 'loteSistema';

export interface RegistroColumn {
  key: RegistroColumnKey;
  label: string;
  shortLabel?: string;
  width: number;
}

const COLUMN_MAP: Record<RegistroColumnKey, RegistroColumn> = {
  item: { key: 'item', label: 'Item/Referência', shortLabel: 'Item', width: 28 },
  nf: { key: 'nf', label: 'NF', width: 16 },
  processo: { key: 'processo', label: 'PROC', width: 16 },
  m2: { key: 'm2', label: 'M²', width: 10 },
  largura: { key: 'largura', label: 'Largura', shortLabel: 'Larg.', width: 10 },
  mLinear: { key: 'mLinear', label: 'M Linear (Comprimento)', shortLabel: 'M Lin', width: 20 },
  lote: { key: 'lote', label: 'Lote/Batch', width: 24 },
  endereco: { key: 'endereco', label: 'Endereço', width: 18 },
  loteSistema: { key: 'loteSistema', label: 'Lote Final (Sistema)', shortLabel: 'Lote Final', width: 36 },
};

const LAYOUTS = {
  coulisse: ['item', 'm2', 'largura', 'mLinear', 'lote', 'endereco', 'loteSistema'],
  ia: ['item', 'largura', 'mLinear', 'endereco', 'loteSistema'],
  rolo: ['item', 'nf', 'largura', 'm2', 'mLinear', 'lote', 'endereco', 'loteSistema'],
  cortina: ['item', 'nf', 'largura', 'm2', 'mLinear', 'lote', 'endereco', 'loteSistema'],
  celular: ['item', 'processo', 'mLinear', 'lote', 'loteSistema'],
  pvt: ['item', 'nf', 'mLinear', 'lote'],
} satisfies Record<string, RegistroColumnKey[]>;

function normalizeMode(mode?: string | null, fallback: RegistroMode = 'manual'): RegistroMode {
  if (mode === 'manual' || mode === 'openrouter' || mode === 'diversos') return mode;
  return fallback;
}

function normalizeTipo(tipo?: string | null) {
  return (tipo || '').trim().toLowerCase();
}

function layoutForDiversosTipo(tipo: string): RegistroColumnKey[] {
  switch (tipo) {
    case 'pvt': return LAYOUTS.pvt;
    case 'celular': return LAYOUTS.celular;
    case 'cortina': return LAYOUTS.cortina;
    case 'rolo':
    default: return LAYOUTS.rolo;
  }
}

function layoutFromMode(mode: RegistroMode) {
  if (mode === 'manual') return LAYOUTS.coulisse;
  if (mode === 'openrouter') return LAYOUTS.ia;
  return LAYOUTS.rolo; // default diversos
}

export function getRegistroColumns(rows: Registro[], fallbackMode: RegistroMode = 'manual'): RegistroColumn[] {
  if (!rows.length) return layoutFromMode(fallbackMode).map(key => COLUMN_MAP[key]);

  const modes = Array.from(new Set(rows.map(row => normalizeMode(row.modoOrigem, fallbackMode))));
  if (modes.length === 1) {
    const [mode] = modes;

    if (mode === 'diversos') {
      const tipos = Array.from(new Set(rows.map(row => normalizeTipo(row.tipoTecido)).filter(Boolean)));
      if (tipos.length === 1) {
        return layoutForDiversosTipo(tipos[0]).map(key => COLUMN_MAP[key]);
      }
    }

    return layoutFromMode(mode).map(key => COLUMN_MAP[key]);
  }

  // Mixed modes: show all columns that have data
  const mixedOrder: RegistroColumnKey[] = ['item', 'nf', 'processo', 'm2', 'largura', 'mLinear', 'lote', 'endereco', 'loteSistema'];
  const visibility: Record<RegistroColumnKey, boolean> = {
    item: rows.some(row => !!row.item?.trim()),
    nf: rows.some(row => !!row.nf?.trim()),
    processo: rows.some(row => !!row.processo?.trim()),
    m2: rows.some(row => Number(row.m2) > 0),
    largura: rows.some(row => Number(row.largura) > 0),
    mLinear: rows.some(row => Number(row.mLinear) > 0),
    lote: rows.some(row => !!row.lote?.trim()),
    endereco: rows.some(row => !!row.endereco?.trim()),
    loteSistema: rows.some(row => !!row.loteSistema?.trim()),
  };

  return mixedOrder.filter(key => visibility[key]).map(key => COLUMN_MAP[key]);
}
