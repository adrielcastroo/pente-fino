import { Registro } from "@/types";

export type RegistroMode = 'manual' | 'openrouter' | 'diversos' | 'madeira' | 'motor' | 'controle' | 'etiq_pronta';
export type RegistroColumnKey = 'item' | 'nf' | 'processo' | 'm2' | 'largura' | 'mLinear' | 'lote' | 'endereco' | 'loteSistema' | 'quantidade' | 'posicao';

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
  quantidade: { key: 'quantidade', label: 'Quantidade', shortLabel: 'Qtd', width: 14 },
  posicao: { key: 'posicao', label: 'Posição', shortLabel: 'Pos', width: 10 },
};

const LAYOUTS = {
  coulisse: ['item', 'largura', 'm2', 'mLinear', 'lote', 'endereco', 'posicao', 'loteSistema'],
  ia: ['item', 'largura', 'mLinear', 'endereco', 'posicao', 'loteSistema'],
  rolo: ['item', 'nf', 'largura', 'm2', 'mLinear', 'lote', 'endereco', 'posicao', 'loteSistema'],
  cortina: ['item', 'nf', 'largura', 'm2', 'mLinear', 'lote', 'endereco', 'posicao', 'loteSistema'],
  celular: ['item', 'processo', 'm2', 'mLinear', 'lote', 'loteSistema'],
  pvt: ['item', 'nf', 'mLinear', 'lote'],
  madeira: ['item', 'processo', 'quantidade', 'lote', 'loteSistema'],
  motor: ['item', 'nf', 'processo', 'lote', 'quantidade', 'loteSistema'],
  controle: ['item', 'nf', 'lote', 'quantidade', 'loteSistema'],
  etiq_pronta: ['item', 'lote', 'endereco', 'posicao', 'processo', 'mLinear'],
} satisfies Record<string, RegistroColumnKey[]>;

function normalizeMode(mode?: string | null, fallback: RegistroMode = 'manual'): RegistroMode {
  if (mode === 'manual' || mode === 'openrouter' || mode === 'diversos' || mode === 'madeira' || mode === 'motor' || mode === 'controle' || mode === 'etiq_pronta') return mode;
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
  if (mode === 'madeira') return LAYOUTS.madeira;
  if (mode === 'motor') return LAYOUTS.motor;
  if (mode === 'controle') return LAYOUTS.controle;
  if (mode === 'etiq_pronta') return LAYOUTS.etiq_pronta;
  return LAYOUTS.rolo; // default diversos
}

export function getRegistroColumns(rows: Registro[], fallbackMode: RegistroMode = 'manual'): RegistroColumn[] {
  if (!rows.length) return layoutFromMode(fallbackMode).map(key => COLUMN_MAP[key]);

  // Optimization: If all rows are from the same mode and it's not 'diversos', 
  // we can just return the default layout for that mode.
  // This is a common case and avoids the full pass over all rows.
  const firstMode = normalizeMode(rows[0].modoOrigem, fallbackMode);
  
  // Quick check if all rows have the same mode
  let allSameMode = true;
  if (rows.length > 1) {
    for (let i = 1; i < rows.length; i++) {
      if (normalizeMode(rows[i].modoOrigem, fallbackMode) !== firstMode) {
        allSameMode = false;
        break;
      }
    }
  }

  if (allSameMode && firstMode !== 'diversos') {
    return layoutFromMode(firstMode).map(key => COLUMN_MAP[key]);
  }

  // Full pass only if necessary
  let hasMultipleModes = false;
  let firstTipo: string | undefined;
  let hasMultipleTipos = false;

  const visibility: Record<RegistroColumnKey, boolean> = {
    item: false, nf: false, processo: false, m2: false, largura: false,
    mLinear: false, quantidade: false, lote: false, endereco: false, loteSistema: false, posicao: false
  };

  for (let i = 0, len = rows.length; i < len; i++) {
    const row = rows[i];
    const m = normalizeMode(row.modoOrigem, fallbackMode);
    if (!hasMultipleModes && m !== firstMode) hasMultipleModes = true;

    if (m === 'diversos') {
      const t = normalizeTipo(row.tipoTecido);
      if (t) {
        if (firstTipo === undefined) firstTipo = t;
        else if (firstTipo !== t) hasMultipleTipos = true;
      }
    }

    if (!visibility.item && row.item?.trim()) visibility.item = true;
    if (!visibility.nf && row.nf?.trim()) visibility.nf = true;
    if (!visibility.processo && row.processo?.trim()) visibility.processo = true;
    if (!visibility.m2 && Number(row.m2) > 0) visibility.m2 = true;
    if (!visibility.largura && Number(row.largura) > 0) visibility.largura = true;
    if (!visibility.mLinear && Number(row.mLinear) > 0) visibility.mLinear = true;
    if (!visibility.quantidade && Number(row.quantidade) > 0) visibility.quantidade = true;
    if (!visibility.lote && row.lote?.trim()) visibility.lote = true;
    if (!visibility.endereco && row.endereco?.trim()) visibility.endereco = true;
    if (!visibility.loteSistema && row.loteSistema?.trim()) visibility.loteSistema = true;
    if (!visibility.posicao && (row.posicao !== undefined && row.posicao !== null)) visibility.posicao = true;
  }

  if (!hasMultipleModes) {
    if (firstMode === 'diversos' && !hasMultipleTipos && firstTipo) {
      return layoutForDiversosTipo(firstTipo).map(key => COLUMN_MAP[key]);
    }
    return layoutFromMode(firstMode).map(key => COLUMN_MAP[key]);
  }

  const mixedOrder: RegistroColumnKey[] = ['item', 'nf', 'processo', 'm2', 'largura', 'mLinear', 'quantidade', 'lote', 'endereco', 'posicao', 'loteSistema'];
  return mixedOrder.filter(key => visibility[key]).map(key => COLUMN_MAP[key]);
}
