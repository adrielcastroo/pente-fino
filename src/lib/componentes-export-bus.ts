/**
 * Bus simples para expor à TopBar o estado da conferência de Componentes
 * (que vive em state local da página, não no Zustand global).
 *
 * A página registra `count` e `exportFn`; a TopBar assina o store para
 * mostrar o botão "Exportar Excel" como nas outras páginas de conferência.
 */

type Listener = () => void;

let currentCount = 0;
let currentExport: (() => Promise<void> | void) | null = null;
let currentBusy = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const componentesExportBus = {
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getSnapshot() {
    // Objeto estável referente ao "estado" — usamos versão numérica para forçar update.
    return snapshot;
  },
  setCount(n: number) {
    if (n === currentCount) return;
    currentCount = n;
    snapshot = { count: currentCount, exportFn: currentExport, busy: currentBusy };
    emit();
  },
  setExport(fn: (() => Promise<void> | void) | null) {
    if (fn === currentExport) return;
    currentExport = fn;
    snapshot = { count: currentCount, exportFn: currentExport, busy: currentBusy };
    emit();
  },
  setBusy(b: boolean) {
    if (b === currentBusy) return;
    currentBusy = b;
    snapshot = { count: currentCount, exportFn: currentExport, busy: currentBusy };
    emit();
  },
  clear() {
    currentCount = 0;
    currentExport = null;
    currentBusy = false;
    snapshot = { count: 0, exportFn: null, busy: false };
    emit();
  },
};

let snapshot: {
  count: number;
  exportFn: (() => Promise<void> | void) | null;
  busy: boolean;
} = { count: 0, exportFn: null, busy: false };
