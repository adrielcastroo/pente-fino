// ============================================================================
// Hook: impressão (browser/USB/Serial) + testPrint + batchPrint + histórico.
// ============================================================================
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { PrintMethod, PrintOptions, PrintResult, BatchPrintResult, Template, Vars, PickingLike } from '../types/etiqueta';
import { printTemplate } from '../utils/etiquetaPrint';
import { pushHistory } from '../utils/etiquetaHistory';
import { templateToZpl } from '../utils/etiquetaZpl';

export interface UsePrintArgs {
  active: Template | null;
  mergedVars: Vars;
  defaultMethod?: PrintMethod;
}

export interface UsePrintReturn {
  print: (opts?: PrintOptions) => Promise<PrintResult>;
  testPrint: (opts: { method: PrintMethod; mockData?: Vars }) => Promise<PrintResult>;
  batchPrint: (
    pickings: PickingLike[],
    opts: { method: PrintMethod; copiesPerVolume?: boolean; volumesResolver?: (p: PickingLike) => number },
  ) => Promise<BatchPrintResult>;
  isPrinting: boolean;
  lastResult: PrintResult | null;
}

export function useEtiquetaPrint({ active, mergedVars, defaultMethod = 'browser' }: UsePrintArgs): UsePrintReturn {
  const [isPrinting, setPrinting] = useState(false);
  const [lastResult, setLastResult] = useState<PrintResult | null>(null);

  const doPrint = useCallback(async (t: Template, vars: Vars, method: PrintMethod, copies?: number): Promise<PrintResult> => {
    const tCopies: Template = { ...t, copies: copies ?? t.copies };
    const res = await printTemplate(tCopies, vars, method);
    setLastResult(res);
    if (res.ok) {
      try {
        pushHistory({
          templateId: t.id,
          templateName: t.name,
          copies: tCopies.copies,
          payload: (vars.romaneio || t.payload || t.codigo || '').toString(),
          method,
          snapshot: { template: tCopies, vars },
        });
      } catch { /* localStorage cheio, ignora */ }
    }
    return res;
  }, []);

  const print = useCallback(async (opts?: PrintOptions): Promise<PrintResult> => {
    const t = opts?.template ?? active;
    if (!t) {
      const r: PrintResult = { ok: false, method: opts?.method ?? defaultMethod, error: 'Nenhum template ativo.' };
      setLastResult(r); return r;
    }
    const method = opts?.method ?? defaultMethod;
    const vars = opts?.variables ?? mergedVars;
    setPrinting(true);
    try {
      const res = await doPrint(t, vars, method, opts?.copies);
      if (res.ok) toast.success(`Enviado via ${labelMethod(method)}.`);
      else toast.error(`Falha na impressão: ${res.error}`);
      return res;
    } finally {
      setPrinting(false);
    }
  }, [active, defaultMethod, mergedVars, doPrint]);

  const testPrint = useCallback(async ({ method, mockData }: { method: PrintMethod; mockData?: Vars }): Promise<PrintResult> => {
    if (!active) {
      const r: PrintResult = { ok: false, method, error: 'Nenhum template ativo.' };
      setLastResult(r); return r;
    }
    const testVars: Vars = mockData ?? {
      romaneio: 'ROM-TESTE',
      nf: '000000',
      cliente: 'CLIENTE TESTE',
      transportadora: 'TRANSPORTADORA TESTE',
      data: new Date().toLocaleDateString('pt-BR'),
    };
    setPrinting(true);
    try {
      const res = await doPrint(active, testVars, method, 1);
      if (res.ok) toast.success('Teste enviado com sucesso.');
      else toast.error(`Falha no teste: ${res.error}`);
      return res;
    } finally { setPrinting(false); }
  }, [active, doPrint]);

  const batchPrint = useCallback(async (
    pickings: PickingLike[],
    opts: { method: PrintMethod; copiesPerVolume?: boolean; volumesResolver?: (p: PickingLike) => number },
  ): Promise<BatchPrintResult> => {
    if (!active) return { success: 0, failed: pickings.length, errors: ['Nenhum template ativo.'] };
    setPrinting(true);
    const result: BatchPrintResult = { success: 0, failed: 0, errors: [] };
    try {
      for (const p of pickings) {
        const vars: Vars = {
          ...mergedVars,
          romaneio: p.numero,
          nf: String(p.nfe_numero ?? ''),
          cliente: p.cliente,
          transportadora: p.transportadora?.nome ?? '',
          data: new Date().toLocaleDateString('pt-BR'),
        };
        const copies = opts.copiesPerVolume && opts.volumesResolver ? Math.max(1, opts.volumesResolver(p)) : active.copies;
        const res = await doPrint(active, vars, opts.method, copies);
        if (res.ok) result.success += 1;
        else { result.failed += 1; result.errors.push(`${p.numero}: ${res.error}`); }
      }
      return result;
    } finally { setPrinting(false); }
  }, [active, mergedVars, doPrint]);

  return { print, testPrint, batchPrint, isPrinting, lastResult };
}

function labelMethod(m: PrintMethod): string {
  return m === 'browser' ? 'navegador' : m === 'zpl-usb' ? 'ZPL/USB' : 'ZPL/Serial';
}

/** Retorna o ZPL atual do template ativo (para diagnóstico/copy-to-clipboard). */
export function useZplPreview(active: Template | null, vars: Vars): string {
  if (!active) return '';
  return templateToZpl(active, vars);
}
