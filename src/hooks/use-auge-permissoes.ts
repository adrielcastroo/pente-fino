import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { AugeAction, AugeArea } from '@/lib/auge-permissions';

interface AugePermissoes {
  areas: string[];
  actions: string[];
  loading: boolean;
  hasArea: (a: AugeArea | string) => boolean;
  canAction: (a: AugeAction | string) => boolean;
  refresh: () => Promise<void>;
}

export function useAugePermissoes(): AugePermissoes {
  const { user, isAdmin } = useAuth();
  const [areas, setAreas] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setAreas([]); setActions([]); setLoading(false); return;
    }
    setLoading(true);
    try {
      const { data } = await (supabase.rpc as any)('get_my_auge_permissoes');
      const row = Array.isArray(data) ? data[0] : data;
      setAreas(row?.areas ?? []);
      setActions(row?.actions ?? []);
    } catch (e) {
      console.warn('[useAugePermissoes] fallback', e);
      setAreas([]); setActions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const hasArea = useCallback(
    (a: string) => isAdmin || areas.includes(a),
    [isAdmin, areas],
  );
  const canAction = useCallback(
    (a: string) => isAdmin || actions.includes(a),
    [isAdmin, actions],
  );

  return { areas, actions, loading, hasArea, canAction, refresh: load };
}
