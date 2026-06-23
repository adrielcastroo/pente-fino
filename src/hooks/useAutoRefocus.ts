import { RefObject, useEffect } from 'react';

/**
 * Mantém foco em um input crítico (ex.: bipagem por scanner bluetooth)
 * mesmo após o usuário trocar de aba, fechar um toast ou voltar para a janela.
 * Faz nada quando `enabled` é falso — use junto com `useIsMobile()`/`useIsTablet()`
 * para não interferir no desktop.
 */
export function useAutoRefocus(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  delayMs = 80,
): void {
  useEffect(() => {
    if (!enabled) return;
    const refocus = () => {
      if (document.activeElement?.tagName === 'INPUT' && document.activeElement !== ref.current) {
        return; // não roube foco de outro campo aberto pelo usuário
      }
      window.setTimeout(() => ref.current?.focus(), delayMs);
    };
    window.addEventListener('focus', refocus);
    document.addEventListener('visibilitychange', refocus);
    return () => {
      window.removeEventListener('focus', refocus);
      document.removeEventListener('visibilitychange', refocus);
    };
  }, [ref, enabled, delayMs]);
}
