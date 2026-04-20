import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

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

/**
 * Tracks the current user's presence in a shared Supabase Realtime channel.
 * Detects idle (mouse/keyboard/touch) and tab visibility to switch between
 * 'online' and 'away'. On unmount/sign-out the channel automatically removes
 * the presence entry, which other clients will read as 'offline'.
 */
export function usePresenceTracker() {
  const { user, profile } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const currentStatusRef = useRef<PresenceStatus>('online');

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    const track = (status: PresenceStatus) => {
      currentStatusRef.current = status;
      const meta: PresenceMeta = {
        user_id: user.id,
        display_name: profile?.display_name ?? user.email?.split('@')[0] ?? null,
        avatar_url: profile?.avatar_url ?? null,
        status,
        online_at: new Date().toISOString(),
      };
      channel.track(meta);
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

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        track('online');
        resetIdle();
      }
    });

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener('visibilitychange', onVisibility);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, profile?.display_name, profile?.avatar_url]);
}

/**
 * Subscribes to the team presence channel as a read-only listener.
 * Returns a map of user_id -> PresenceMeta for currently connected users.
 */
export function useTeamPresence(onChange: (map: Record<string, PresenceMeta>) => void) {
  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL + '-listener', {
      config: { presence: { key: 'listener-' + Math.random().toString(36).slice(2) } },
    });

    const sharedChannel = supabase.channel(PRESENCE_CHANNEL);

    const computeMap = () => {
      const state = sharedChannel.presenceState<PresenceMeta>();
      const map: Record<string, PresenceMeta> = {};
      Object.entries(state).forEach(([key, metas]) => {
        const latest = metas[metas.length - 1];
        if (latest?.user_id) map[latest.user_id] = latest;
        else if (key) map[key] = latest as PresenceMeta;
      });
      onChange(map);
    };

    sharedChannel
      .on('presence', { event: 'sync' }, computeMap)
      .on('presence', { event: 'join' }, computeMap)
      .on('presence', { event: 'leave' }, computeMap)
      .subscribe();

    return () => {
      supabase.removeChannel(sharedChannel);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
