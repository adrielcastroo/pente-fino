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
  const [est, col, nivStr] = addr.split('.');
  const rawNivel = nivStr.replace('N', '');
  const nivel = parseInt(rawNivel, 10);
  if (isNaN(nivel)) return null;
  return { estrutura: est, coluna: col, nivel };
}

export function fmtML(v: number): string {
  if (typeof v !== 'number') return '';
  const rounded = Math.round(v * 10) / 10;
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
  const mlFormatted = fmtML(mLinear) || '0M';
  const procTrimmed = (processo || '').trim();
  const nfTrimmed = (nf || '').trim();
  const labelPrefix = procTrimmed ? `PROC ${procTrimmed}` : (nfTrimmed ? `NF ${nfTrimmed}` : '');
  const addrTrimmed = (endereco || '').trim();
  const baseParts = [addrTrimmed, labelPrefix, mlFormatted].filter(Boolean);
  const base = baseParts.join(' ');
  const itemNorm = (itemCode || '').trim().toLowerCase();
  
  // To prevent collisions even after deletions, we check all existing suffixes
  // Optimized: Early return if no registers or if first part matches
  if (existingRegistros.length === 0) return base;

  const usedSuffixes: number[] = [];
  for (let i = 0, len = existingRegistros.length; i < len; i++) {
    const r = existingRegistros[i];
    const rItemNorm = (r.item || '').trim().toLowerCase();
    
    // Quick filter check
    if (rItemNorm !== itemNorm) continue;
    
    const rAddrTrimmed = (r.endereco || '').trim();
    if (rAddrTrimmed !== addrTrimmed) continue;

    const rProc = (r.processo || '').trim();
    const rNf = (r.nf || '').trim();
    const rLabel = rProc ? `PROC ${rProc}` : (rNf ? `NF ${rNf}` : '');
    if (rLabel !== labelPrefix) continue;

    const rMlFormatted = fmtML(r.mLinear);
    if (rMlFormatted !== mlFormatted) continue;

    const ls = r.loteSistema || '';
    if (ls === base) {
      usedSuffixes.push(0);
      continue;
    }
    const lastPart = ls.split('-').pop();
    if (lastPart) {
      const num = parseInt(lastPart, 10);
      if (!isNaN(num)) usedSuffixes.push(num);
    }
  }

  if (usedSuffixes.length === 0) return base;
  
  let maxSuffix = 0;
  for (let i = 0, len = usedSuffixes.length; i < len; i++) {
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
  const itemNorm = (item || '').trim().toLowerCase();
  const count = existingRegistros.reduce((acc, r) => 
    (r.item || '').trim().toLowerCase() === itemNorm ? acc + 1 : acc, 0);
  const cxLabel = `CX${(count + 1).toString().padStart(2, '0')}`;
  const procTrimmed = processo.trim();
  const mlFormatted = fmtML(mLinear);
  const parts = [cxLabel, procTrimmed ? `PROC ${procTrimmed}` : '', mlFormatted].filter(Boolean);
  return parts.join(' ');
}
