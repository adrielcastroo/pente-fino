import { Registro } from "@/types";

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
  const procTrimmed = processo.trim();
  const nfTrimmed = (nf || '').trim();
  const labelPrefix = procTrimmed ? `PROC ${procTrimmed}` : (nfTrimmed ? `NF ${nfTrimmed}` : '');
  const addrTrimmed = (endereco || '').trim();
  const baseParts = [addrTrimmed, labelPrefix, mlFormatted].filter(Boolean);
  const base = baseParts.join(' ');
  const itemNorm = (itemCode || '').trim().toLowerCase();
  
  const count = existingRegistros.reduce((acc, r) => {
    if ((r.item || '').trim().toLowerCase() !== itemNorm) return acc;
    if (fmtML(r.mLinear) !== mlFormatted) return acc;
    if ((r.endereco || '').trim() !== addrTrimmed) return acc;

    const rProc = (r.processo || '').trim();
    const rNf = (r.nf || '').trim();
    const rLabel = rProc ? `PROC ${rProc}` : (rNf ? `NF ${rNf}` : '');
    
    return rLabel === labelPrefix ? acc + 1 : acc;
  }, 0);
  
  return count === 0 ? base : `${base}-${count}`;
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
