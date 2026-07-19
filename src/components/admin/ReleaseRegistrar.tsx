import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

const STORAGE_KEY = 'pente-fino:last-registered-build';

/**
 * Registra o build atual em app_releases assim que um usuário autenticado
 * carrega a app. Idempotente: o RPC só cria uma nova linha quando a dupla
 * (version, build_time) ainda não existe; caso contrário apenas marca essa
 * linha como is_current. Guarda uma flag em localStorage para não repetir
 * a chamada no mesmo build por sessão.
 */
export function ReleaseRegistrar() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
    const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null;
    if (!version || !buildTime) return;
    const marker = `${version}@${buildTime}`;
    try {
      if (localStorage.getItem(STORAGE_KEY) === marker) return;
    } catch {}
    (supabase as any)
      .rpc('register_app_release', {
        p_version: version,
        p_build_time: buildTime,
        p_notes: null,
      })
      .then(({ error }: any) => {
        if (error) {
          // Sem toast: falha silenciosa não deve incomodar usuário.
          console.warn('[release] falha ao registrar', error.message);
          return;
        }
        try { localStorage.setItem(STORAGE_KEY, marker); } catch {}
      });
  }, [user, loading]);

  return null;
}
