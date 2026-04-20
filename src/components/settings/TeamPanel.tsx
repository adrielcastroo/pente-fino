import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTeamPresence, type PresenceMeta, type PresenceStatus } from '@/hooks/use-presence';
import { Users, Circle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const STATUS_LABEL: Record<PresenceStatus, string> = {
  online: 'Online',
  away: 'Ausente',
  offline: 'Offline',
};

const STATUS_DOT: Record<PresenceStatus, string> = {
  online: 'bg-emerald-500 shadow-[0_0_8px_hsl(var(--primary)/0.5)]',
  away: 'bg-amber-500',
  offline: 'bg-muted-foreground/40',
};

const STATUS_BADGE: Record<PresenceStatus, string> = {
  online: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  away: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  offline: 'bg-muted/40 text-muted-foreground border-border/40',
};

export default function TeamPanel() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [presence, setPresence] = useState<Record<string, PresenceMeta>>({});
  const [query, setQuery] = useState('');

  useTeamPresence(setPresence);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .order('display_name', { ascending: true });
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          setProfiles([]);
        } else {
          setProfiles((data ?? []) as ProfileRow[]);
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message || 'Erro ao carregar membros.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const members = useMemo(() => {
    const list = profiles.map((p) => {
      const pres = presence[p.id];
      const status: PresenceStatus = pres?.status ?? 'offline';
      return {
        id: p.id,
        name: p.display_name || 'Sem nome',
        avatar: p.avatar_url,
        status,
        lastSeen: pres?.online_at ?? null,
      };
    });
    const filtered = query
      ? list.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
      : list;
    const order: Record<PresenceStatus, number> = { online: 0, away: 1, offline: 2 };
    return filtered.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  }, [profiles, presence, query]);

  const counts = useMemo(() => {
    const c = { online: 0, away: 0, offline: 0 };
    members.forEach((m) => { c[m.status]++; });
    return c;
  }, [members]);

  return (
    <div className="space-y-5">
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {(['online', 'away', 'offline'] as PresenceStatus[]).map((s) => (
          <div
            key={s}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${STATUS_BADGE[s]}`}
          >
            <Circle className={`w-2.5 h-2.5 fill-current ${s === 'online' ? 'text-emerald-500' : s === 'away' ? 'text-amber-500' : 'text-muted-foreground'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{STATUS_LABEL[s]}</span>
              <span className="text-xl font-black tabular-nums">{counts[s]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar membro..."
          className="pl-9 h-11 rounded-xl bg-muted/30 border-border/30"
        />
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))
        ) : loadError ? (
          <div className="text-center py-10 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive">
            <p className="text-sm font-bold">Não foi possível carregar os membros.</p>
            <p className="text-xs opacity-70 mt-1">{loadError}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum membro encontrado.</p>
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 p-3.5 rounded-2xl bg-muted/20 border border-border/20 hover:border-border/40 transition-colors"
            >
              {/* Avatar with status indicator */}
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${STATUS_DOT[m.status]}`}
                  aria-label={STATUS_LABEL[m.status]}
                />
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.status === 'online' && 'Ativo agora'}
                  {m.status === 'away' && 'Ausente temporariamente'}
                  {m.status === 'offline' && (m.lastSeen ? 'Desconectado' : 'Nunca conectou')}
                </p>
              </div>

              {/* Status badge */}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_BADGE[m.status]}`}>
                {STATUS_LABEL[m.status]}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
