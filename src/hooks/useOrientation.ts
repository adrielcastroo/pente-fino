import { useEffect, useState } from 'react';

export type Orientation = 'portrait' | 'landscape';

function read(): Orientation {
  if (typeof window === 'undefined') return 'landscape';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Detecta orientação do dispositivo. Usa screen.orientation quando disponível
 * (mais confiável em tablets) e cai para window.resize como fallback.
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(read);

  useEffect(() => {
    const handler = () => setOrientation(read());

    const so = (typeof screen !== 'undefined' && 'orientation' in screen)
      ? (screen as Screen & { orientation?: ScreenOrientation }).orientation
      : undefined;

    if (so && typeof so.addEventListener === 'function') {
      so.addEventListener('change', handler);
      window.addEventListener('resize', handler);
      return () => {
        so.removeEventListener('change', handler);
        window.removeEventListener('resize', handler);
      };
    }

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return orientation;
}
