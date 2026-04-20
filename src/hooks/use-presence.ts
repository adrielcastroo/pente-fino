import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface PresenceMeta {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: PresenceStatus;
  online_at: string;
}

const PRESENCE_CHANNEL = 'team-presence';
const AWAY_AFTER_MS = 5 * 60 * 1000; // 5 min idle => away

// ---------------------------------------------------------------------------
// Shared channel singleton
// ---------------------------------------------------------------------------
// Supabase Realtime allows only ONE channel instance per topic per client and
// requires every `.on()` listener to be registered BEFORE `.subscribe()`.
// We therefore keep a single shared channel, register listeners up-front, and
// reference-count subscribers so the channel stays alive while either the
// tracker or any team-presence listener is mounted.

interface SharedPresence {
  channel: RealtimeChannel;
  refCount: number;
  listeners: Set<(map: Record<string, PresenceMeta>) => void>;
  presenceKey: string;
}

let shared: SharedPresence | null = null;

function computeMap(channel: RealtimeChannel): Record<string, PresenceMeta> {
  const map: Record<string, PresenceMeta> = {};
  try {
    const state = channel.presenceState<PresenceMeta>();
    Object.values(state).forEach((metas) => {
      if (!Array.isArray(metas) || metas.length === 0) return;
      const latest = metas[metas.length - 1] as PresenceMeta | undefined;
      if (latest && latest.user_id) {
        map[latest.user_id] = latest;
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[presence] computeMap error', err);
  }
  return map;
}

function notify() {
  if (!shared) return;
  const map = computeMap(shared.channel);
  shared.listeners.forEach((cb) => {
    try { cb(map); } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[presence] listener error', err);
    }
  });
}

function ensureShared(presenceKey: string): SharedPresence {
  if (shared) return shared;
  const channel = supabase.channel(PRESENCE_CHANNEL, {
    config: { presence: { key: presenceKey } },
  });
  // Register all presence listeners BEFORE subscribe — required by Supabase.
  channel
    .on('presence', { event: 'sync' }, notify)
    .on('presence', { event: 'join' }, notify)
    .on('presence', { event: 'leave' }, notify)
    .subscribe();

  shared = { channel, refCount: 0, listeners: new Set(), presenceKey };
  return shared;
}

function releaseShared() {
  if (!shared) return;
  if (shared.refCount > 0) return;
  if (shared.listeners.size > 0) return;
  try {
    shared.channel.untrack();
  } catch { /* noop */ }
  try {
    supabase.removeChannel(shared.channel);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[presence] removeChannel error', err);
  }
  shared = null;
}

// ---------------------------------------------------------------------------
// Public hooks
// ---------------------------------------------------------------------------

/**
 * Tracks the current user's presence in the shared Supabase Realtime channel.
 * Detects idle (mouse/keyboard/touch) and tab visibility to switch between
 * 'online' and 'away'. On unmount/sign-out the channel removes the presence
 * entry, which other clients will read as 'offline'.
 */
export function usePresenceTracker() {
  const { user, profile } = useAuth();
  const idleTimerRef = useRef<number | null>(null);
  const currentStatusRef = useRef<PresenceStatus>('online');

  useEffect(() => {
    if (!user) return;

    const s = ensureShared(user.id);
    s.refCount++;

    const track = (status: PresenceStatus) => {
      currentStatusRef.current = status;
      const meta: PresenceMeta = {
        user_id: user.id,
        display_name: profile?.display_name ?? user.email?.split('@')[0] ?? null,
        avatar_url: profile?.avatar_url ?? null,
        status,
        online_at: new Date().toISOString(),
      };
      try { s.channel.track(meta); } catch { /* noop */ }
    };

    const resetIdle = () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (currentStatusRef.current !== 'online' && document.visibilityState === 'visible') {
        track('online');
      }
      idleTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === 'visible') track('away');
      }, AWAY_AFTER_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        track('away');
      } else {
        track('online');
        resetIdle();
      }
    };

    // Initial track (channel may already be subscribed from a previous mount).
    track('online');
    resetIdle();

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener('visibilitychange', onVisibility);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      try { s.channel.untrack(); } catch { /* noop */ }
      s.refCount--;
      releaseShared();
    };
  }, [user, profile?.display_name, profile?.avatar_url]);
}

/**
 * Subscribes to the team presence channel as a read-only listener.
 * Returns a map of user_id -> PresenceMeta for currently connected users.
 */
export function useTeamPresence(onChange: (map: Record<string, PresenceMeta>) => void) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    const listenerKey = 'listener-' + Math.random().toString(36).slice(2);
    const s = ensureShared(listenerKey);
    const wrapper = (map: Record<string, PresenceMeta>) => cbRef.current(map);
    s.listeners.add(wrapper);

    // Emit current snapshot immediately.
    try { wrapper(computeMap(s.channel)); } catch { /* noop */ }

    return () => {
      if (shared) {
        shared.listeners.delete(wrapper);
        releaseShared();
      }
    };
  }, []);
}
