/**
 * Fila de impressão persistida em sessionStorage.
 * Cada item vem de um XML NF-e importado e gera 1..N cópias (respeitando volumes).
 */
import { useCallback, useEffect, useState } from 'react';

export interface PrintQueueItem {
  id: string; // uuid local
  nfNumero: string;
  chaveAcesso: string;
  destinatario: string;
  transportadora: string;
  volumes: number;
  pesoBruto: number;
  valorTotal: number;
  status: 'pending' | 'printing' | 'done' | 'error';
  errorMsg?: string;
  addedAt: number;
}

const KEY = 'etiqueta:print-queue:v1';

function read(): PrintQueueItem[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrintQueueItem[];
  } catch {
    return [];
  }
}

function write(items: PrintQueueItem[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota */
  }
}

export function usePrintQueue() {
  const [items, setItems] = useState<PrintQueueItem[]>(() => read());

  // sincroniza entre abas/instâncias
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: PrintQueueItem[]) => {
    write(next);
    setItems(next);
  }, []);

  const add = useCallback(
    (item: Omit<PrintQueueItem, 'id' | 'status' | 'addedAt'>) => {
      const novo: PrintQueueItem = {
        ...item,
        id: crypto.randomUUID(),
        status: 'pending',
        addedAt: Date.now(),
      };
      persist([...read(), novo]);
      return novo;
    },
    [persist],
  );

  const addMany = useCallback(
    (list: Array<Omit<PrintQueueItem, 'id' | 'status' | 'addedAt'>>) => {
      const current = read();
      const novos: PrintQueueItem[] = list.map((it) => ({
        ...it,
        id: crypto.randomUUID(),
        status: 'pending' as const,
        addedAt: Date.now(),
      }));
      persist([...current, ...novos]);
      return novos;
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist(read().filter((x) => x.id !== id)),
    [persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const patch = useCallback(
    (id: string, p: Partial<PrintQueueItem>) => {
      persist(read().map((x) => (x.id === id ? { ...x, ...p } : x)));
    },
    [persist],
  );

  return { items, add, addMany, remove, clear, patch };
}
