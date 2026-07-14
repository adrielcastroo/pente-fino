// ============================================================================
// Impressão: navegador (@media print), WebUSB e Web Serial.
// ============================================================================
import {
  sendZplViaUsb,
  sendZplViaSerial,
  isWebUsbSupported,
  isWebSerialSupported,
} from '@/pages/expedicao/etiqueta-helpers';
import type { Template, PrintResult, Vars } from '../types/etiqueta';
import { templateToZpl } from './etiquetaZpl';

export { sendZplViaUsb, sendZplViaSerial, isWebUsbSupported, isWebSerialSupported };

/** Aciona `window.print()`. As regras @page são injetadas pelo componente PrintStyles. */
export function browserPrint(): PrintResult {
  try {
    window.print();
    return { ok: true, method: 'browser' };
  } catch (e) {
    return { ok: false, method: 'browser', error: e instanceof Error ? e.message : 'Falha ao imprimir.' };
  }
}

export async function printTemplate(
  t: Template,
  vars: Vars,
  method: 'browser' | 'zpl-usb' | 'zpl-serial',
): Promise<PrintResult> {
  if (method === 'browser') return browserPrint();
  const zpl = templateToZpl(t, vars);
  const res = method === 'zpl-usb' ? await sendZplViaUsb(zpl) : await sendZplViaSerial(zpl);
  if (res.ok) return { ok: true, method };
  return { ok: false, method, error: res.error };
}
