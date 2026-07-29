import { Registro } from "@/types";

// Shared, memoized date formatters for consistent, efficient performance
const dateFormatterBR = new Intl.DateTimeFormat('pt-BR', { 
  day: '2-digit', month: '2-digit', year: 'numeric', 
  hour: '2-digit', minute: '2-digit' 
});

const timeFormatterBR = new Intl.DateTimeFormat('pt-BR', { 
  hour: '2-digit', minute: '2-digit' 
});

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : dateFormatterBR.format(d);
  } catch {
    return '—';
  }
}

export function formatTimeBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : timeFormatterBR.format(d);
  } catch {
    return '—';
  }
}


export const ENDERECO_REGEX = /^([A-Z0-9]{3,10}\.[A-Z0-9]\.[A-Z0-9]+|CHÃO)$/i;

export function parseEndereco(addr: string) {
  if (!addr) return null;
  const normalizedAddr = addr.trim().toUpperCase();
  if (normalizedAddr === 'CHÃO') {
    return { estrutura: 'CHÃO', coluna: 'G', nivel: 1 };
  }
  if (!ENDERECO_REGEX.test(normalizedAddr)) return null;
  const parts = addr.split('.');
  if (parts.length < 3) return null;
  const [est, col, nivStr] = parts;
  const rawNivel = nivStr.toUpperCase().replace('N', '');
  const nivel = parseInt(rawNivel, 10);
  if (isNaN(nivel)) return null;
  return { estrutura: est, coluna: col, nivel };
}

export function fmtML(v: number): string {
  if (typeof v !== 'number' || v === 0) return '';
  const rounded = Math.round(v * 10) / 10;
  if (rounded === 0) return '';
  return (rounded % 1 === 0 ? Math.round(rounded).toString() : rounded.toFixed(1).replace('.', ',')) + 'M';
}

export function formatML(v: number): string {
  return fmtML(v);
}

export function extractLarguraFromItem(item: string): number {
  const parts = item.split('-');
  if (parts.length < 4) return 0;
  const raw = parts[3];
  const num = parseInt(raw, 10);
  if (isNaN(num) || num <= 0) return 0;
  if (num >= 100) return num / 100;
  return num / 10;
}

export function generateLoteSistema(
  processo: string,
  endereco: string,
  mLinear: number,
  existingRegistros: Registro[],
  nf?: string,
  itemCode?: string
): string {
  const len = existingRegistros.length;
  const procTrimmed = (processo || '').trim();
  const nfTrimmed = (nf || '').trim();
  const addrTrimmed = (endereco || '').trim();
  const itemNorm = (itemCode || '').trim().toLowerCase();
  
  const mlFormatted = fmtML(mLinear) || '0M';
  const labelPrefix = procTrimmed ? `PROC ${procTrimmed}` : (nfTrimmed ? `NF ${nfTrimmed}` : '');
  const baseParts = [addrTrimmed, labelPrefix, mlFormatted].filter(Boolean);
  const base = baseParts.join(' ');
  
  if (len === 0) return base;

  const usedSuffixes: number[] = [];
  
  for (let i = 0; i < len; i++) {
    const r = existingRegistros[i];
    
    // Quick, non-string checks first
    if (r.mLinear !== mLinear) continue;
    if (r.endereco !== endereco) continue;
    
    // Check item
    const rItemNorm = (r.item || '').trim().toLowerCase();
    if (rItemNorm !== itemNorm) continue;
    
    // Check proc/nf label
    const rProc = (r.processo || '').trim();
    const rNf = (r.nf || '').trim();
    const rLabel = rProc ? `PROC ${rProc}` : (rNf ? `NF ${rNf}` : '');
    if (rLabel !== labelPrefix) continue;

    const ls = r.loteSistema || '';
    if (ls === base) {
      usedSuffixes.push(0);
      continue;
    }
    
    const lastDashIndex = ls.lastIndexOf('-');
    if (lastDashIndex !== -1 && lastDashIndex > base.length - 1) {
      const suffixStr = ls.slice(lastDashIndex + 1);
      const num = parseInt(suffixStr, 10);
      if (!isNaN(num)) usedSuffixes.push(num);
    }
  }

  if (usedSuffixes.length === 0) return base;
  
  let maxSuffix = 0;
  for (let i = 0, uLen = usedSuffixes.length; i < uLen; i++) {
    if (usedSuffixes[i] > maxSuffix) maxSuffix = usedSuffixes[i];
  }
  
  return `${base}-${maxSuffix + 1}`;
}


export function generateLoteSistemaCaixa(
  processo: string,
  item: string,
  mLinear: number,
  existingRegistros: Registro[]
): string {
  const procNorm = (processo || '').trim().toLowerCase();
  const itemNorm = (item || '').trim().toLowerCase();
  let maxCx = 0;
  let countDuplicates = 0;

  // Box numbering scopes by PROC: count all scanned items within the same proc.
  for (let i = 0, len = existingRegistros.length; i < len; i++) {
    const r = existingRegistros[i];
    const rProc = (r.processo || '').trim().toLowerCase();
    const rItem = (r.item || '').trim().toLowerCase();
    
    if (rProc !== procNorm) continue;
    
    // Check for identical items (Proc + Item + Metragem) to handle suffixes -1, -2...
    if (rItem === itemNorm && r.mLinear === mLinear) {
      countDuplicates++;
    }

    if (!r.loteSistema?.startsWith('CX')) continue;
    const match = r.loteSistema.match(/^CX(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxCx) maxCx = num;
    }
  }

  const cxLabel = `CX${(maxCx + 1).toString().padStart(2, '0')}`;
  const procTrimmed = (processo || '').trim();
  const mlFormatted = fmtML(mLinear);
  const suffix = countDuplicates > 0 ? `-${countDuplicates}` : '';
  
  const parts = [cxLabel, procTrimmed ? `PROC ${procTrimmed}` : '', `${mlFormatted}${suffix}`].filter(Boolean);
  return parts.join(' ');
}

export function parseCoulisseString(input: string) {
  const trimmed = input.trim();
  // Regex to match "MODELO" ... "PROC" <val> ... "CX" <val>
  // Case-insensitive, capture model, proc, and cx
  const regex = /^(.*?)\s+PROC\s+([A-Z0-9]+)\s+CX\s*(\d+)/i;
  const match = trimmed.match(regex);
  
  if (match) {
    return {
      modelo: match[1].trim(),
      processo: match[2].trim(),
      cx: parseInt(match[3], 10)
    };
  }
  
  // Fallback for just "MODELO" or other partial formats if regex fails
  return {
    modelo: trimmed,
    processo: '',
    cx: 0
  };
}

export const TEC_CONFIG: Record<string, { cols: string[]; levels: number }> = {
  TEC00: { cols: ['A', 'B'], levels: 10 },
  TEC01: { cols: ['A', 'B', 'C', 'D', 'E', 'F'], levels: 6 },
  TEC02: { cols: ['A', 'B'], levels: 4 },
  TEC03: { cols: ['A', 'B'], levels: 9 },
  TEC04: { cols: ['A', 'B', 'C'], levels: 5 },
  TEC05: { cols: ['A', 'B', 'C'], levels: 5 },
  'CHÃO': { cols: ['G'], levels: 1 },
};

export const TOTAL_SLOTS = Object.values(TEC_CONFIG).reduce((acc, { cols, levels }) => acc + (cols.length * levels * 30), 0);