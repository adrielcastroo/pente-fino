import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { countPending, subscribe } from '@/lib/offline-queue';
import { startOfflineSync, retryNow } from '@/lib/offline-sync';

/**
 * Globally watches navigator.onLine. Shows a persistent toast when the user
 * loses connection and a confirmation toast when it returns. Also starts the
 * offline archive sync loop and exposes the pending-queue count.
 */
export function useNetworkStatus() {
  const offlineToastId = useRef<string | number | null>(null);
  const pendingToastId = useRef<string | number | null>(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    startOfflineSync();

    const refresh = async () => {
      try { setPending(await countPending()); } catch { /* noop */ }
    };
    const unsub = subscribe(refresh);
    void refresh();

    const handleOffline = () => {
      if (offlineToastId.current !== null) return;
      offlineToastId.current = toast.error('Conexão perdida', {
        description: 'Suas alterações serão sincronizadas quando voltar.',
        duration: Infinity,
      });
    };

    const handleOnline = () => {
      if (offlineToastId.current !== null) {
        toast.dismiss(offlineToastId.current);
        offlineToastId.current = null;
      }
      toast.success('Conexão restaurada', { duration: 2500 });
      void retryNow();
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) handleOffline();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      unsub();
    };
  }, []);

  // Persistent badge for pending archives
  useEffect(() => {
    if (pending > 0) {
      pendingToastId.current = toast.warning(`${pending} conferência(s) pendente(s) de envio`, {
        id: 'offline-pending',
        description: 'Serão enviadas automaticamente quando a conexão estabilizar.',
        duration: Infinity,
        action: { label: 'Tentar agora', onClick: () => { void retryNow(); } },
      });
    } else if (pendingToastId.current !== null) {
      toast.dismiss('offline-pending');
      pendingToastId.current = null;
    }
  }, [pending]);

  return { pending };
}
