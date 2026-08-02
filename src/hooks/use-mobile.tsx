import { useState, useEffect } from 'react';

// Desktop "real": tem mouse (hover + pointer fine), OU tela muito larga (≥1366px) como fallback.
// Mudança: removemos `(min-width: 1024px) and (hover: hover) and (pointer: fine)` porque em
// 2-in-1/notebooks touch com mouse Bluetooth entre 1024–1365px, isso falhava: desktop não era
// detectado, sidebar sumia e BottomTabBar aparecia erradamente. Agora basta ter mouse real,
// independentemente da largura da janela.
const DESKTOP_QUERY =
  '(hover: hover) and (pointer: fine), (min-width: 1366px)';

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, [query]);

  return matches;
};

export const useIsDesktop = () => useMediaQuery(DESKTOP_QUERY);

export const useIsMobile = () => {
  const isDesktop = useIsDesktop();
  const narrow = useMediaQuery('(max-width: 767px)');
  return !isDesktop && narrow;
};

export const useIsTablet = () => {
  const isDesktop = useIsDesktop();
  const inRange = useMediaQuery('(min-width: 768px) and (max-width: 1365px)');
  return !isDesktop && inRange;
};

export const useIsLandscape = () =>
  useMediaQuery('(orientation: landscape)');
