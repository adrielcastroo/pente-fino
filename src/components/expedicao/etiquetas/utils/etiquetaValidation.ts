export { validateBarcode, type ValidationResult } from '@/pages/expedicao/etiqueta-helpers';
import type { Template } from '../types/etiqueta';
import { validateBarcode } from '@/pages/expedicao/etiqueta-helpers';

export function validatePayload(t: Pick<Template, 'showBarcode' | 'showQr' | 'payload' | 'barcodeFmt'>): { ok: boolean; msg?: string } {
  if (!t.showBarcode && !t.showQr) return { ok: true };
  const payload = (t.payload ?? '').trim();
  if (!payload) return { ok: false, msg: 'Payload vazio (necessário para códigos).' };
  if (t.showBarcode) return validateBarcode(payload, t.barcodeFmt);
  return { ok: true };
}
