import { supabase } from '@/integrations/supabase/client';

export class SessionExpiredError extends Error {
  constructor() {
    super('SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Garante que existe uma sessão autenticada válida antes de gravar no banco.
 * Faz refresh quando o token está prestes a expirar (≤ 60s).
 * Lança SessionExpiredError caso não seja possível obter uma sessão válida.
 */
export async function ensureAuthenticatedSession(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh = !session || (session.expires_at != null && session.expires_at - nowSec <= 60);

  if (needsRefresh) {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    if (!refreshed?.user?.id) throw new SessionExpiredError();
    return refreshed.user.id;
  }

  if (!session?.user?.id) throw new SessionExpiredError();
  return session.user.id;
}

export function isSessionExpiredError(err: unknown): boolean {
  if (err instanceof SessionExpiredError) return true;
  const anyErr = err as any;
  if (!anyErr) return false;
  if (anyErr.message === 'SESSION_EXPIRED') return true;
  if (anyErr.code === '42501') return true;
  const msg = String(anyErr.message || '').toLowerCase();
  return msg.includes('row-level security') || msg.includes('row level security');
}
