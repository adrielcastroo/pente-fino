import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Globally watches navigator.onLine. Shows a persistent toast when the user
 * loses connection and a confirmation toast when it returns.
 */
export function useNetworkStatus() {
  const offlineToastId = useRef<string | number | null>(null);

  useEffect(() => {
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
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) handleOffline();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
