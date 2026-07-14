// Re-export do gerador ZPL avançado (^CI28 UTF-8, ^FB word-wrap, ^PQ copies).
export { generateZpl, type ZplInput } from '@/pages/expedicao/etiqueta-helpers';

import { generateZpl } from '@/pages/expedicao/etiqueta-helpers';
import { interpolate } from './etiquetaInterpolation';
import type { Template, Vars } from '../types/etiqueta';

export function templateToZpl(t: Template, vars: Vars): string {
  return generateZpl({
    widthMm: t.widthMm,
    heightMm: t.heightMm,
    titulo: interpolate(t.titulo, vars),
    subtitulo: interpolate(t.subtitulo, vars),
    codigo: interpolate(t.codigo, vars),
    destino: interpolate(t.destino, vars),
    observacoes: interpolate(t.observacoes, vars),
    customFields: t.customFields.map((f) => ({ label: f.label, value: interpolate(f.value, vars) })),
    showQr: t.showQr,
    showBarcode: t.showBarcode,
    barcodeFmt: t.barcodeFmt,
    payload: interpolate(t.payload || t.codigo, vars),
    copies: Math.max(1, t.copies || 1),
  });
}
