import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Search, ShieldCheck, User as UserIcon } from 'lucide-react';
import { AUGE_AREAS, AUGE_ACTIONS } from '@/lib/auge-permissions';
import { cn } from '@/lib/utils';

type UserRow = {
  id: string;
  display_name: string | null;
  email?: string | null;
};

type PermRow = {
  user_id: string;
  areas: string[];
  actions: string[];
  notes: string | null;
  updated_at?: string | null;
};

export default function AugePermissoesTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [perms, setPerms] = useState<Record<string, PermRow>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PermRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [uRes, pRes] = await Promise.all([
      (supabase.from('profiles' as any).select('id,display_name,email').order('display_name') as any),
      (supabase.from('auge_permissoes' as any).select('*') as any),
    ]);
    const uList: UserRow[] = uRes.data ?? [];
    const pMap: Record<string, PermRow> = {};
    for (const r of (pRes.data ?? []) as PermRow[]) pMap[r.user_id] = r;
    setUsers(uList);
    setPerms(pMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.display_name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q),
    );
  }, [users, query]);

  const selectUser = (u: UserRow) => {
    setSelectedId(u.id);
    const existing = perms[u.id];
    setDraft({
      user_id: u.id,
      areas: existing?.areas ?? [],
      actions: existing?.actions ?? [],
      notes: existing?.notes ?? '',
    });
  };

  const toggle = (list: 'areas' | 'actions', key: string) => {
    setDraft(d => {
      if (!d) return d;
      const set = new Set(d[list]);
      set.has(key) ? set.delete(key) : set.add(key);
      return { ...d, [list]: Array.from(set) };
    });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      user_id: draft.user_id,
      areas: draft.areas,
      actions: draft.actions,
      notes: draft.notes,
      updated_by: u.user?.id ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await (supabase.from('auge_permissoes' as any).upsert(payload, { onConflict: 'user_id' }) as any);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar', { description: error.message });
      return;
    }
    toast.success('Permissões atualizadas');
    setPerms(prev => ({ ...prev, [draft.user_id]: { ...(prev[draft.user_id] ?? {} as any), ...payload } }));
  };

  const selectedUser = users.find(u => u.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      {/* Lista de usuários */}
      <Card className="p-3 rounded-md border-border/40 shadow-sm flex flex-col min-h-[480px]">
        <div className="relative mb-2">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-8 text-xs"
          />
        </div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-0.5">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 rounded-md" />)
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum usuário encontrado.</p>
          ) : (
            filtered.map(u => {
              const p = perms[u.id];
              const count = (p?.areas.length ?? 0) + (p?.actions.length ?? 0);
              const active = u.id === selectedId;
              return (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={cn(
                    'w-full text-left rounded-md px-2 py-1.5 flex items-center gap-2 text-xs transition-colors',
                    active ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/40 text-muted-foreground',
                  )}
                >
                  <UserIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{u.display_name || u.email || u.id.slice(0, 8)}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{count}</Badge>
                  )}
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Editor */}
      <Card className="p-4 rounded-md border-border/40 shadow-sm">
        {!draft || !selectedUser ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-16">
            <ShieldCheck className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Selecione um usuário para editar as permissões</p>
            <p className="text-xs mt-1 max-w-md">
              Marque as áreas e ações que o usuário tem no Auge — o Pente Fino e o Fio (IA) respeitam esse recorte.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold">{selectedUser.display_name || selectedUser.email}</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedUser.email}</p>
              </div>
              <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Salvando…' : 'Salvar permissões'}
              </Button>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Áreas liberadas ({draft.areas.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {AUGE_AREAS.map(a => {
                  const checked = draft.areas.includes(a.key);
                  return (
                    <label
                      key={a.key}
                      className={cn(
                        'flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs cursor-pointer transition-colors',
                        checked ? 'border-primary/40 bg-primary/5' : 'border-border/40 hover:bg-muted/30',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle('areas', a.key)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{a.label}</span>
                        {a.hint && <span className="block text-[10px] text-muted-foreground">{a.hint}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Ações permitidas ({draft.actions.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                {AUGE_ACTIONS.map(a => {
                  const checked = draft.actions.includes(a.key);
                  return (
                    <label
                      key={a.key}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs cursor-pointer transition-colors',
                        checked ? 'border-primary/40 bg-primary/5' : 'border-border/40 hover:bg-muted/30',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle('actions', a.key)}
                      />
                      <span className="font-medium">{a.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Observações internas
              </p>
              <Textarea
                value={draft.notes ?? ''}
                onChange={(e) => setDraft(d => d ? { ...d, notes: e.target.value } : d)}
                placeholder="Contexto do vínculo com o Auge, restrições especiais…"
                className="min-h-[70px] text-xs"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
