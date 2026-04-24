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


export const ENDERECO_REGEX = /^[A-Z0-9]{5}\.[A-Z0-9]\.[A-Z0-9]+$/;

export function parseEndereco(addr: string) {
  if (!addr || !ENDERECO_REGEX.test(addr)) return null;
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
  
  if (!existingRegistros || existingRegistros.length === 0) return base;

  const usedSuffixes: number[] = [];
  const baseDash = `${base}-`;
  
  for (let i = 0, len = existingRegistros.length; i < len; i++) {
    const r = existingRegistros[i];
    
    // Performance: Quick numeric/primitive checks first to avoid string operations
    if (r.mLinear !== mLinear) continue;
    if (r.endereco !== endereco) continue;
    
    // Item check
    if ((r.item || '').trim().toLowerCase() !== itemNorm) continue;
    
    // Proc/NF check
    const rProc = (r.processo || '').trim();
    const rNf = (r.nf || '').trim();
    const rLabel = rProc ? `PROC ${rProc}` : (rNf ? `NF ${rNf}` : '');
    if (rLabel !== labelPrefix) continue;

    const ls = r.loteSistema || '';
    if (ls === base) {
      usedSuffixes.push(0);
    } else if (ls.startsWith(baseDash)) {
      const num = parseInt(ls.slice(baseDash.length), 10);
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
  let maxCx = 0;

  // Box numbering scopes by PROC: count all scanned items within the same proc.
  // Resets automatically when proc changes (different proc = different scope).
  for (let i = 0, len = existingRegistros.length; i < len; i++) {
    const r = existingRegistros[i];
    if ((r.processo || '').trim().toLowerCase() !== procNorm) continue;
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
  const parts = [cxLabel, procTrimmed ? `PROC ${procTrimmed}` : '', mlFormatted].filter(Boolean);
  return parts.join(' ');
}
