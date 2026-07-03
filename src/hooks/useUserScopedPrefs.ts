import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/use-auth';

/**
 * Escopa as preferências pessoais (labelSettings e dashboardDialogTheme) por
 * usuário logado / visitante, evitando que configurações de uma pessoa vazem
 * para outra que use o mesmo navegador.
 *
 * Chave: `user-prefs:<uid>` para logados, `user-prefs:guest:<nome>` para
 * visitantes, `user-prefs:anon` como fallback.
 */
const scopeKey = (uid: string | null, guestName: string, isGuest: boolean) => {
  if (uid) return `user-prefs:${uid}`;
  if (isGuest) return `user-prefs:guest:${guestName || 'default'}`;
  return 'user-prefs:anon';
};

export function useUserScopedPrefs() {
  const { user, isGuest, guestName, loading } = useAuth();
  const labelSettings = useAppStore(s => s.labelSettings);
  const setLabelSettings = useAppStore(s => s.setLabelSettings);
  const dashboardDialogTheme = useAppStore(s => s.dashboardDialogTheme);
  const setDashboardDialogTheme = useAppStore(s => s.setDashboardDialogTheme);

  const currentScope = useRef<string | null>(null);
  const hydrating = useRef(false);

  // Hidrata quando a identidade muda.
  useEffect(() => {
    if (loading) return;
    const key = scopeKey(user?.id ?? null, guestName, isGuest);
    if (currentScope.current === key) return;
    currentScope.current = key;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        hydrating.current = true;
        if (parsed.labelSettings) setLabelSettings(parsed.labelSettings);
        if (parsed.dashboardDialogTheme) setDashboardDialogTheme(parsed.dashboardDialogTheme);
        // libera a escrita no próximo tick para não gravar o valor recém lido
        setTimeout(() => { hydrating.current = false; }, 0);
      }
    } catch (e) {
      console.warn('[useUserScopedPrefs] hydrate failed', e);
    }
  }, [user?.id, isGuest, guestName, loading, setLabelSettings, setDashboardDialogTheme]);

  // Persiste alterações no escopo atual.
  useEffect(() => {
    if (loading || hydrating.current || !currentScope.current) return;
    try {
      localStorage.setItem(
        currentScope.current,
        JSON.stringify({ labelSettings, dashboardDialogTheme }),
      );
    } catch (e) {
      console.warn('[useUserScopedPrefs] persist failed', e);
    }
  }, [labelSettings, dashboardDialogTheme, loading]);
}
