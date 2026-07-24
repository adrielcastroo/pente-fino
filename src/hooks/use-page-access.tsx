import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface PageAccessContextValue {
  loading: boolean;
  /** true se o usuário pertence a pelo menos uma equipe (nesse caso as permissões restringem). */
  isRestricted: boolean;
  allowed: Set<string>;
  can: (pageKey: string) => boolean;
  refresh: () => Promise<void>;
}

const PageAccessContext = createContext<PageAccessContextValue | undefined>(undefined);

export function PageAccessProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [allowed, setAllowed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user || isGuest) {
      setAllowed(new Set());
      setIsRestricted(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: memberships }, { data: perms }] = await Promise.all([
        (supabase.from('team_members' as any).select('team_id').eq('user_id', user.id) as any),
        (supabase.from('team_page_permissions' as any).select('page_key').eq('user_id', user.id).eq('allowed', true) as any),
      ]);
      const inTeam = Array.isArray(memberships) && memberships.length > 0;
      setIsRestricted(inTeam);
      const set = new Set<string>();
      (perms ?? []).forEach((r: any) => set.add(r.page_key));
      setAllowed(set);
    } catch (err) {
      // Em erro, não bloqueia navegação (fail-open na camada de UI; RLS protege o dado).
      console.warn('[page-access] load failed', err);
      setIsRestricted(false);
      setAllowed(new Set());
    } finally {
      setLoading(false);
    }
  }, [user, isGuest]);

  useEffect(() => { load(); }, [load]);

  const can = useCallback(
    (pageKey: string) => {
      if (isAdmin) return true;
      if (!isRestricted) return true;
      return allowed.has(pageKey);
    },
    [isAdmin, isRestricted, allowed],
  );

  const value = useMemo<PageAccessContextValue>(
    () => ({ loading, isRestricted, allowed, can, refresh: load }),
    [loading, isRestricted, allowed, can, load],
  );

  return <PageAccessContext.Provider value={value}>{children}</PageAccessContext.Provider>;
}

export function usePageAccess(): PageAccessContextValue {
  const ctx = useContext(PageAccessContext);
  if (!ctx) {
    // Fallback permissivo se usado fora do provider (ex.: rotas públicas).
    return {
      loading: false,
      isRestricted: false,
      allowed: new Set(),
      can: () => true,
      refresh: async () => {},
    };
  }
  return ctx;
}
