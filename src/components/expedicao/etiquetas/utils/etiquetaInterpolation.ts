import { interpolate as baseInterpolate, KNOWN_VARS } from '@/pages/expedicao/etiqueta-helpers';
import type { Vars } from '../types/etiqueta';

export { KNOWN_VARS };

export function interpolate(input: string | undefined, vars: Vars): string {
  return baseInterpolate(input ?? '', vars);
}

/** Detecta variáveis referenciadas em qualquer campo string. */
export function extractVarRefs(...values: (string | undefined)[]): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  for (const v of values) {
    if (!v) continue;
    let m: RegExpExecArray | null;
    while ((m = re.exec(v))) set.add(m[1]);
  }
  return Array.from(set);
}
