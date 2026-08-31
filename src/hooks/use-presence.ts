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
// We keep a single shared channel, register listeners up-front, and reference-
// count subscribers so the channel stays alive while any tracker or listener
// is mounted.

interface SharedPresence {
  channel: RealtimeChannel;
  refCount: number;
  listeners: Set<(map: Record<string, PresenceMeta>) => void>;
  presenceKey: string;
  isSubscribed: boolean;
  trackerCount: number; // how many active trackers — only the LAST one untracks
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

async function safeTrack(channel: RealtimeChannel, meta: PresenceMeta) {
  try {
    await channel.track(meta);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[presence] track error', err);
    throw err;
  }
}

async function safeUntrack(channel: RealtimeChannel) {
  try {
    await channel.untrack();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[presence] untrack error', err);
  }
}

function ensureShared(presenceKey: string): SharedPresence {
  if (shared) return shared;
  const channel = supabase.channel(PRESENCE_CHANNEL, {
    config: { presence: { key: presenceKey } },
  });

  const local: SharedPresence = {
    channel,
    refCount: 0,
    listeners: new Set(),
    presenceKey,
    isSubscribed: false,
    trackerCount: 0,
  };

  // Register all presence listeners BEFORE subscribe — required by Supabase.
  channel
    .on('presence', { event: 'sync' }, notify)
    .on('presence', { event: 'join' }, notify)
    .on('presence', { event: 'leave' }, notify)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        local.isSubscribed = true;
        // Emit initial snapshot to any already-mounted listeners.
        notify();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // eslint-disable-next-line no-console
        console.warn('[presence] channel status:', status);
        local.isSubscribed = false;
      } else if (status === 'CLOSED') {
        // CLOSED é o estado normal após untrack/removeChannel (ex.: sair do app
        // principal para o painel admin, que não monta o MainLayout). Não é um
        // erro — apenas marca o canal como não-subscrito em silêncio.
        local.isSubscribed = false;
      }
    });

  shared = local;
  return shared;
}

function releaseShared() {
  if (!shared) return;
  if (shared.refCount > 0) return;
  if (shared.listeners.size > 0) return;
  // Defer removal slightly to survive React StrictMode double-invoke / fast remounts.
  const target = shared;
  setTimeout(() => {
    if (shared !== target) return; // a new mount took over
    if (target.refCount > 0 || target.listeners.size > 0) return;
    try {
      supabase.removeChannel(target.channel);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[presence] removeChannel error', err);
    }
    if (shared === target) shared = null;
  }, 100);
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
  const initTimerRef = useRef<number | null>(null);
  const desiredStatusRef = useRef<PresenceStatus>('online');
  const currentStatusRef = useRef<PresenceStatus | null>(null);
  // Keep latest profile in a ref so metadata updates don't tear down the channel.
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    if (!user) return;

    let active = true;
    const s = ensureShared(user.id);
    s.refCount++;
    s.trackerCount++;

    const getVisibleStatus = (): PresenceStatus => (
      document.visibilityState === 'visible' ? 'online' : 'away'
    );

    desiredStatusRef.current = getVisibleStatus();
    currentStatusRef.current = null;

    const buildMeta = (status: PresenceStatus): PresenceMeta => ({
      user_id: user.id,
      display_name: profileRef.current?.display_name ?? user.email?.split('@')[0] ?? null,
      avatar_url: profileRef.current?.avatar_url ?? null,
      status,
      online_at: new Date().toISOString(),
    });

    const track = (status: PresenceStatus) => {
      desiredStatusRef.current = status;
      if (!s.isSubscribed) return; // track() before SUBSCRIBED is a no-op / error
      if (currentStatusRef.current === status) return;
      currentStatusRef.current = status;
      void safeTrack(s.channel, buildMeta(status)).catch(() => {
        if (currentStatusRef.current === status) {
          currentStatusRef.current = null;
        }
      });
    };

    // Track once subscribed. If not yet subscribed, retry shortly.
    let initTries = 0;
    const initTrack = () => {
      if (!active) return;
      if (s.isSubscribed) {
        track(desiredStatusRef.current);
        return;
      }
      if (initTries++ < 20) {
        initTimerRef.current = window.setTimeout(initTrack, 150);
      }
    };
    initTrack();

    const resetIdle = () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (document.visibilityState !== 'visible') return;
      if (desiredStatusRef.current !== 'online') {
        track('online');
      }
      idleTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === 'visible') track('away');
      }, AWAY_AFTER_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (idleTimerRef.current) {
          window.clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
        track('away');
      } else {
        track('online');
        resetIdle();
      }
    };

    if (document.visibilityState === 'visible') {
      resetIdle();
    } else {
      track('away');
    }

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener('visibilitychange', onVisibility);
      if (initTimerRef.current) {
        window.clearTimeout(initTimerRef.current);
        initTimerRef.current = null;
      }
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      s.trackerCount--;
      s.refCount--;
      // Only the LAST tracker untracks the user from the channel.
      if (s.trackerCount <= 0) {
        currentStatusRef.current = null;
        void safeUntrack(s.channel);
      }
      releaseShared();
    };
    // user.id is the only stable dep; profile updates flow via profileRef.
  }, [user?.id]);
}

/**
 * Subscribes to the team presence channel as a read-only listener.
 * Returns a map of user_id -> PresenceMeta for currently connected users.
 */
export function useTeamPresence(onChange: (map: Record<string, PresenceMeta>) => void) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    // Use a stable, unique key per listener mount so it never collides with
    // a tracker's user.id (which would corrupt the presence bucket).
    const listenerKey = 'listener-' + Math.random().toString(36).slice(2);
    const s = ensureShared(listenerKey);
    s.refCount++;
    const wrapper = (map: Record<string, PresenceMeta>) => cbRef.current(map);
    s.listeners.add(wrapper);

    // Emit current snapshot immediately if channel is ready.
    if (s.isSubscribed) {
      try { wrapper(computeMap(s.channel)); } catch { /* noop */ }
    }

    return () => {
      if (shared) {
        shared.listeners.delete(wrapper);
        shared.refCount--;
        releaseShared();
      }
    };
  }, []);
}
