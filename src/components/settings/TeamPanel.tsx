import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTeamPresence, type PresenceMeta, type PresenceStatus } from '@/hooks/use-presence';
import { Users, Circle, Search, ShieldCheck, Trash2, Package, Truck, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { ROLE_LABEL, normalizeRole, type Role } from '@/lib/permissions';
import { toast } from 'sonner';

type ModuleKey = 'estoque' | 'expedicao' | 'compras';
const ALL_MODULES: { key: ModuleKey; label: string; icon: typeof Package }[] = [
  { key: 'estoque', label: 'Estoque', icon: Package },
  { key: 'expedicao', label: 'Expedição', icon: Truck },
  { key: 'compras', label: 'Compras', icon: ShoppingCart },
];

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  modules: string[] | null;
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
  online: 'bg-emerald-500/10 text-success dark:text-success border-emerald-500/20',
  away: 'bg-amber-500/10 text-warning dark:text-warning border-amber-500/20',
  offline: 'bg-muted/40 text-muted-foreground border-border/40',
};

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-primary/15 text-primary border-primary/30',
  gerente: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  supervisor: 'bg-amber-500/10 text-warning dark:text-warning border-amber-500/20',
  operador: 'bg-muted/40 text-muted-foreground border-border/40',
};

const ASSIGNABLE_ROLES: Role[] = ['operador', 'supervisor', 'gerente', 'admin'];

export default function TeamPanel() {
  const { user, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, Role>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [presence, setPresence] = useState<Record<string, PresenceMeta>>({});
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useTeamPresence(setPresence);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [{ data: profilesData, error: pErr }, { data: rolesData, error: rErr }] = await Promise.all([
          supabase.from('profiles').select('id, display_name, avatar_url').order('display_name', { ascending: true }),
          (supabase.from('user_roles' as any).select('user_id, role') as any),
        ]);
        if (cancelled) return;
        if (pErr) throw pErr;
        setProfiles((profilesData ?? []) as ProfileRow[]);
        const map: Record<string, Role> = {};
        if (!rErr && rolesData) {
          (rolesData as any[]).forEach((r) => {
            const next = normalizeRole(r.role);
            const prev = map[r.user_id];
            // keep highest role per user
            if (!prev || rolePriority(next) < rolePriority(prev)) map[r.user_id] = next;
          });
        }
        setRolesByUser(map);
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message || 'Erro ao carregar membros.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const changeRole = async (userId: string, newRole: Role) => {
    setSavingId(userId);
    try {
      // Replace all rows for this user with a single new role row
      const { error: delErr } = await (supabase.from('user_roles' as any).delete().eq('user_id', userId) as any);
      if (delErr) throw delErr;
      const { error: insErr } = await (supabase.from('user_roles' as any).insert({ user_id: userId, role: newRole }) as any);
      if (insErr) throw insErr;
      setRolesByUser((m) => ({ ...m, [userId]: newRole }));
      toast.success(`Perfil atualizado para ${ROLE_LABEL[newRole]}.`);
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao atualizar perfil.');
    } finally {
      setSavingId(null);
    }
  };

  const members = useMemo(() => {
    const list = profiles.map((p) => {
      const pres = presence[p.id];
      const status: PresenceStatus = pres?.status ?? 'offline';
      return {
        id: p.id,
        name: p.display_name || 'Sem nome',
        avatar: p.avatar_url,
        status,
        role: rolesByUser[p.id] ?? 'operador',
        lastSeen: pres?.online_at ?? null,
      };
    });
    const filtered = query
      ? list.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
      : list;
    const order: Record<PresenceStatus, number> = { online: 0, away: 1, offline: 2 };
    return filtered.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  }, [profiles, presence, rolesByUser, query]);

  const counts = useMemo(() => {
    const c = { online: 0, away: 0, offline: 0 };
    members.forEach((m) => { c[m.status]++; });
    return c;
  }, [members]);

  return (
    <div className="space-y-5">
      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['online', 'away', 'offline'] as PresenceStatus[]).map((s) => (
          <div key={s} className={`flex items-center gap-3 p-4 rounded-md border ${STATUS_BADGE[s]}`}>
            <Circle className={`w-2.5 h-2.5 fill-current ${s === 'online' ? 'text-success' : s === 'away' ? 'text-warning' : 'text-muted-foreground'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{STATUS_LABEL[s]}</span>
              <span className="text-xl font-semibold tabular-nums">{counts[s]}</span>
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            Como <strong className="text-foreground">Admin</strong>, você pode alterar o perfil de cada membro.
            Mudanças são aplicadas imediatamente e refletem nas permissões do banco.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar membro..."
          className="pl-9 h-11 rounded-md bg-muted/30 border-border/30"
        />
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-16 rounded-md" />))
        ) : loadError ? (
          <div className="text-center py-10 rounded-md border border-destructive/20 bg-destructive/5 text-destructive">
            <p className="text-sm font-bold">Não foi possível carregar os membros.</p>
            <p className="text-xs opacity-70 mt-1">{loadError}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum membro encontrado.</p>
          </div>
        ) : (
          members.map((m) => {
            const isSelf = user?.id === m.id;
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 sm:gap-4 p-3.5 rounded-md bg-muted/20 border border-border/20 hover:border-border/40 transition-colors">
                <div className="relative">
                  <div className="w-11 h-11 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{m.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${STATUS_DOT[m.status]}`} aria-label={STATUS_LABEL[m.status]} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {m.name}
                    {isSelf && <span className="ml-2 text-[10px] font-medium text-muted-foreground">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.status === 'online' && 'Ativo agora'}
                    {m.status === 'away' && 'Ausente temporariamente'}
                    {m.status === 'offline' && (m.lastSeen ? 'Desconectado' : 'Nunca conectou')}
                  </p>
                </div>

                {isAdmin && !isSelf ? (
                  <Select value={m.role} onValueChange={(v) => changeRole(m.id, v as Role)} disabled={savingId === m.id}>
                    <SelectTrigger className="h-9 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">{ROLE_LABEL[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${ROLE_BADGE[m.role]}`}>
                    {ROLE_LABEL[m.role]}
                  </Badge>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function rolePriority(r: Role): number {
  return ({ admin: 1, gerente: 2, supervisor: 3, operador: 4 } as const)[r];
}
