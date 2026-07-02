import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { bipPecaCall } from '@/hooks/expedicao/useExpedicaoData';
import { toast } from 'sonner';
import {
  BipQueueItem,
  bumpTries,
  enqueueBip,
  getQueue,
  removeFromQueue,
} from '@/lib/expedicao/offlineQueue';

/**
 * Manages an IndexedDB-backed queue of bipagens.
 * - When online: attempts to sync every 5s and on `online` event.
 * - When offline: enqueue only.
 */
export function useOfflineBipQueue() {
  const qc = useQueryClient();
  const [online, setOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [pending, setPending] = useState<BipQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setPending(await getQueue());
  }, []);

  const flush = useCallback(async () => {
    if (syncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const q = await getQueue();
    if (q.length === 0) return;
    setSyncing(true);
    let ok = 0;
    let fail = 0;
    for (const item of q) {
      try {
        await bipPecaCall(item.pickingId, item.codigoPeca);
        await removeFromQueue(item.id);
        ok += 1;
        qc.invalidateQueries({ queryKey: ['expedicao', 'picking-itens', item.pickingId] });
      } catch (err) {
        await bumpTries(item.id);
        fail += 1;
        // Stop on first failure — likely still offline / server issue
        break;
      }
    }
    setSyncing(false);
    await refresh();
    if (ok > 0) toast.success(`${ok} bipagem(ns) sincronizada(s)`);
    if (fail > 0 && ok === 0) toast.error('Falha ao sincronizar bipagens');
  }, [qc, refresh, syncing]);

  useEffect(() => {
    refresh();
    const onOnline = () => { setOnline(true); flush(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const iv = setInterval(() => { if (navigator.onLine) flush(); }, 5000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(iv);
    };
  }, [flush, refresh]);

  const queueBip = useCallback(
    async (pickingId: string, codigoPeca: string) => {
      await enqueueBip(pickingId, codigoPeca);
      await refresh();
    },
    [refresh],
  );

  return { online, pending, syncing, queueBip, flush };
}
