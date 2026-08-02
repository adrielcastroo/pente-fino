import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  Settings2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { atLeast, ROLE_LABEL, type Role, normalizeRole } from '@/lib/permissions';
import { MODULE_LABEL, PAGE_REGISTRY, pagesByModule, type PageEntry, type PageModule } from '@/lib/page-registry';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePageAccess } from '@/hooks/use-page-access';

interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Member {
  user_id: string;
  team_id: string;
  display_name: string;
  avatar_url: string | null;
  role: Role;
  modules: string[];
}

interface ProfileLite {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  modules: string[];
}

export default function EquipesPage() {
  const { role, user, isAdmin, modules: myModules } = useAuth();
  const pageAccess = usePageAccess();
  const canManage = atLeast(role, 'supervisor');
  // Módulos que o gestor pode conceder (admin concede tudo).
  const grantableModules = useMemo<string[]>(
    () => (isAdmin ? ['estoque', 'expedicao', 'compras'] : myModules),
    [isAdmin, myModules],
  );

  const [teams, setTeams] = useState<Team[]>([]);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [rolesByUser, setRolesByUser] = useState<Record<string, Role>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<Team | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [managingMember, setManagingMember] = useState<Member | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: t }, { data: m }, { data: p }, { data: r }] = await Promise.all([
        (supabase.from('teams' as any).select('*').order('name') as any),
        (supabase.from('team_members' as any).select('team_id, user_id') as any),
        supabase.from('profiles').select('id, display_name, avatar_url, modules'),
        (supabase.from('user_roles' as any).select('user_id, role') as any),
      ]);
      const teamsList = (t ?? []) as Team[];
      setTeams(teamsList);
      if (!selectedTeamId && teamsList.length) setSelectedTeamId(teamsList[0].id);

      const profMap: Record<string, ProfileLite> = {};
      (p ?? []).forEach((row: any) => {
        profMap[row.id] = {
          id: row.id,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
          modules: Array.isArray(row.modules) && row.modules.length ? row.modules : ['estoque'],
        };
      });
      setProfiles(profMap);

      const roleMap: Record<string, Role> = {};
      (r ?? []).forEach((row: any) => {
        const nr = normalizeRole(row.role);
        const prev = roleMap[row.user_id];
        if (!prev || priority(nr) < priority(prev)) roleMap[row.user_id] = nr;
      });
      setRolesByUser(roleMap);

      const grouped: Record<string, Member[]> = {};
      (m ?? []).forEach((row: any) => {
        const prof = profMap[row.user_id];
        const member: Member = {
          user_id: row.user_id,
          team_id: row.team_id,
          display_name: prof?.display_name ?? 'Sem nome',
          avatar_url: prof?.avatar_url ?? null,
          role: roleMap[row.user_id] ?? 'operador',
          modules: prof?.modules ?? ['estoque'],
        };
        (grouped[row.team_id] ??= []).push(member);
      });
      Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.display_name.localeCompare(b.display_name)));
      setMembersByTeam(grouped);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao carregar equipes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  if (!canManage) return <Navigate to="/" replace />;

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;
  const selectedMembers = selectedTeam ? membersByTeam[selectedTeam.id] ?? [] : [];

  const openNewTeam = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamDesc('');
    setTeamDialogOpen(true);
  };

  const openEditTeam = (t: Team) => {
    setEditingTeam(t);
    setTeamName(t.name);
    setTeamDesc(t.description ?? '');
    setTeamDialogOpen(true);
  };

  const saveTeam = async () => {
    if (!teamName.trim()) { toast.error('Informe o nome da equipe.'); return; }
    setSaving(true);
    try {
      if (editingTeam) {
        const { error } = await (supabase.from('teams' as any)
          .update({ name: teamName.trim(), description: teamDesc.trim() || null })
          .eq('id', editingTeam.id) as any);
        if (error) throw error;
        toast.success('Equipe atualizada.');
      } else {
        const { data, error } = await (supabase.from('teams' as any)
          .insert({ name: teamName.trim(), description: teamDesc.trim() || null, created_by: user?.id })
          .select('*')
          .single() as any);
        if (error) throw error;
        setSelectedTeamId(data.id);
        toast.success('Equipe criada.');
      }
      setTeamDialogOpen(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao salvar.');
    } finally { setSaving(false); }
  };

  const deleteTeam = async (t: Team) => {
    try {
      const { error } = await (supabase.from('teams' as any).delete().eq('id', t.id) as any);
      if (error) throw error;
      toast.success('Equipe removida.');
      if (selectedTeamId === t.id) setSelectedTeamId(null);
      setConfirmDeleteTeam(null);
      await loadAll();
    } catch (err: any) { toast.error(err?.message || 'Falha ao remover.'); }
  };

  const addMember = async (userId: string) => {
    if (!selectedTeam) return;
    try {
      const { error } = await (supabase.from('team_members' as any)
        .insert({ team_id: selectedTeam.id, user_id: userId, added_by: user?.id }) as any);
      if (error) throw error;
      toast.success('Membro adicionado.');
      setAddMemberOpen(false);
      await loadAll();
      await pageAccess.refresh();
    } catch (err: any) { toast.error(err?.message || 'Falha ao adicionar.'); }
  };

  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const removeMember = async (m: Member) => {
    try {
      const { error } = await (supabase.from('team_members' as any)
        .delete().eq('team_id', m.team_id).eq('user_id', m.user_id) as any);
      if (error) throw error;
      // Também limpa as permissões daquele usuário nessa equipe
      await (supabase.from('team_page_permissions' as any)
        .delete().eq('team_id', m.team_id).eq('user_id', m.user_id) as any);
      toast.success('Membro removido.');
      setMemberToRemove(null);
      await loadAll();
      await pageAccess.refresh();
    } catch (err: any) { toast.error(err?.message || 'Falha ao remover.'); }
  };


  const availableToAdd = useMemo(() => {
    if (!selectedTeam) return [] as ProfileLite[];
    const memberIds = new Set(selectedMembers.map((m) => m.user_id));
    const grantSet = new Set(grantableModules);
    return Object.values(profiles).filter((p) => {
      if (memberIds.has(p.id)) return false;
      if (isAdmin) return true;
      // Gestor só pode adicionar quem compartilha ao menos um módulo com ele.
      return (p.modules ?? []).some((m) => grantSet.has(m));
    });
  }, [profiles, selectedMembers, selectedTeam, grantableModules, isAdmin]);

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Equipes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie equipes e libere páginas por membro. {isAdmin ? 'Como admin, você concede acesso em qualquer módulo.' : `Você só concede páginas dos módulos que possui: ${grantableModules.map((m) => MODULE_LABEL[m as PageModule] ?? m).join(', ')}.`}
          </p>
        </div>
        <Button onClick={openNewTeam} className="gap-2">
          <Plus className="w-4 h-4" /> Nova equipe
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Lista de equipes */}
        <aside className="rounded-lg border border-border/40 bg-card">
          <div className="p-3 border-b border-border/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Equipes ({teams.length})
          </div>
          <div className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)
            ) : teams.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhuma equipe. Clique em <strong>Nova equipe</strong>.
              </div>
            ) : (
              teams.map((t) => {
                const count = membersByTeam[t.id]?.length ?? 0;
                const active = t.id === selectedTeamId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeamId(t.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-md border transition-colors',
                      active
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-transparent border-transparent hover:bg-muted/40',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate">{t.name}</span>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">{count}</Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Detalhe */}
        <section className="rounded-lg border border-border/40 bg-card min-h-[400px]">
          {!selectedTeam ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Selecione uma equipe à esquerda ou crie uma nova.</p>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{selectedTeam.name}</h2>
                  {selectedTeam.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedTeam.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditTeam(selectedTeam)} className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDeleteTeam(selectedTeam)}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </Button>
                </div>
              </header>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Membros ({selectedMembers.length})
                </h3>
                <Button size="sm" onClick={() => setAddMemberOpen(true)} className="gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Adicionar membro
                </Button>
              </div>

              <div className="space-y-2">
                {selectedMembers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/40 rounded-md">
                    Nenhum membro nesta equipe.
                  </div>
                ) : (
                  selectedMembers.map((m) => (
                    <div key={m.user_id} className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-muted/20 border border-border/20">
                      <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt={m.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-primary">{m.display_name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{m.display_name}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{ROLE_LABEL[m.role]}</Badge>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setManagingMember(m)} className="gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" /> Gerenciar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMemberToRemove(m)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Dialog: criar/editar equipe */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Editar equipe' : 'Nova equipe'}</DialogTitle>
            <DialogDescription>Dê um nome claro (ex.: Compras, Logística, PCP).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Nome</label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Ex.: Compras" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Descrição (opcional)</label>
              <Textarea value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveTeam} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete team */}
      <AlertDialog open={!!confirmDeleteTeam} onOpenChange={(o) => !o && setConfirmDeleteTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe {confirmDeleteTeam?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os membros e permissões desta equipe serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteTeam && deleteTeam(confirmDeleteTeam)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add member */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar membro</DialogTitle>
            <DialogDescription>Selecione um usuário para adicionar à equipe {selectedTeam?.name}.</DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Buscar usuário..." />
            <CommandList>
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
              <CommandGroup>
                {availableToAdd.map((p) => (
                  <CommandItem key={p.id} value={p.display_name ?? p.id} onSelect={() => addMember(p.id)}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mr-2 overflow-hidden">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-primary">{(p.display_name ?? '?').charAt(0).toUpperCase()}</span>}
                    </div>
                    <span className="flex-1">{p.display_name ?? 'Sem nome'}</span>
                    <Badge variant="outline" className="text-[10px]">{ROLE_LABEL[rolesByUser[p.id] ?? 'operador']}</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Permissões do membro */}
      {managingMember && selectedTeam && (
        <MemberPermissionsDialog
          member={managingMember}
          team={selectedTeam}
          grantableModules={grantableModules}
          onClose={() => setManagingMember(null)}
          onSaved={async () => { await pageAccess.refresh(); }}
        />
      )}
    </div>
  );
}

function priority(r: Role): number {
  return ({ admin: 1, gerente: 2, supervisor: 3, operador: 4 } as const)[r];
}

// ────────────────────────────────────────────────────────────────
// MemberPermissionsDialog
// ────────────────────────────────────────────────────────────────

interface MemberPermissionsDialogProps {
  member: Member;
  team: Team;
  grantableModules: string[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

function MemberPermissionsDialog({ member, team, grantableModules, onClose, onSaved }: MemberPermissionsDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowedInTeam, setAllowedInTeam] = useState<Set<string>>(new Set());
  const [effectiveUnion, setEffectiveUnion] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const allGrouped = useMemo(() => pagesByModule(), []);
  // Interseção entre módulos do gestor e módulos do membro-alvo. Só esses aparecem.
  const visibleModules = useMemo(() => {
    const memberSet = new Set(member.modules ?? ['estoque']);
    return grantableModules.filter((m) => memberSet.has(m));
  }, [grantableModules, member.modules]);
  const grouped = useMemo(() => {
    const out: Partial<Record<PageModule, PageEntry[]>> = {};
    visibleModules.forEach((m) => {
      const key = m as PageModule;
      if (allGrouped[key]) out[key] = allGrouped[key];
    });
    return out as Record<PageModule, PageEntry[]>;
  }, [allGrouped, visibleModules]);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [{ data: teamPerms }, { data: allPerms }] = await Promise.all([
          (supabase.from('team_page_permissions' as any)
            .select('page_key, allowed')
            .eq('team_id', team.id)
            .eq('user_id', member.user_id) as any),
          (supabase.from('team_page_permissions' as any)
            .select('page_key')
            .eq('user_id', member.user_id)
            .eq('allowed', true) as any),
        ]);
        if (cancelled) return;
        const inTeam = new Set<string>();
        (teamPerms ?? []).forEach((r: any) => { if (r.allowed) inTeam.add(r.page_key); });
        setAllowedInTeam(inTeam);
        const union = new Set<string>();
        (allPerms ?? []).forEach((r: any) => union.add(r.page_key));
        setEffectiveUnion(union);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [team.id, member.user_id]);

  const toggle = (key: string, value: boolean) => {
    setAllowedInTeam((prev) => {
      const next = new Set(prev);
      if (value) next.add(key); else next.delete(key);
      return next;
    });
  };

  const toggleModule = (pages: PageEntry[], value: boolean) => {
    setAllowedInTeam((prev) => {
      const next = new Set(prev);
      pages.forEach((p) => { if (value) next.add(p.key); else next.delete(p.key); });
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      // Só mexe nas páginas dos módulos visíveis ao gestor — preserva o que outros gestores
      // já concederam em módulos fora do escopo dele.
      const visiblePageKeys = Object.values(grouped).flat().map((p) => p.key);
      if (visiblePageKeys.length > 0) {
        const { error: delErr } = await (supabase.from('team_page_permissions' as any)
          .delete()
          .eq('team_id', team.id)
          .eq('user_id', member.user_id)
          .in('page_key', visiblePageKeys) as any);
        if (delErr) throw delErr;
      }
      const rowsToInsert = Array.from(allowedInTeam)
        .filter((k) => visiblePageKeys.includes(k))
        .map((page_key) => ({
          team_id: team.id,
          user_id: member.user_id,
          page_key,
          allowed: true,
          updated_by: user?.id,
        }));
      if (rowsToInsert.length > 0) {
        const { error: insErr } = await (supabase.from('team_page_permissions' as any).insert(rowsToInsert) as any);
        if (insErr) throw insErr;
      }
      toast.success('Permissões salvas.');
      await onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao salvar.');
    } finally { setSaving(false); }
  };

  // União efetiva calculada em tempo real: pega o que existe em outras equipes + o estado atual desta.
  const liveUnion = useMemo(() => {
    const s = new Set(effectiveUnion);
    allowedInTeam.forEach((k) => s.add(k));
    return s;
  }, [effectiveUnion, allowedInTeam]);

  const matches = (label: string) =>
    !filter.trim() || label.toLowerCase().includes(filter.toLowerCase());

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
              {member.avatar_url
                ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-primary">{member.display_name.charAt(0).toUpperCase()}</span>}
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {member.display_name}
                <Badge variant="outline" className="text-[10px]">{ROLE_LABEL[member.role]}</Badge>
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                Permissões nesta equipe: <strong>{team.name}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar páginas..."
            className="pl-9 h-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)
          ) : visibleModules.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border/40 rounded-md text-sm text-muted-foreground">
              Vocês não compartilham nenhum módulo. Peça a um admin para liberar módulos em comum antes de conceder páginas.
            </div>
          ) : (
            (Object.keys(grouped) as (keyof typeof grouped)[]).map((mod) => {
              const pages = grouped[mod].filter((p) => matches(p.label));
              if (pages.length === 0) return null;
              const allOn = pages.every((p) => allowedInTeam.has(p.key));
              const someOn = pages.some((p) => allowedInTeam.has(p.key));
              return (
                <div key={mod} className="rounded-md border border-border/40">
                  <div className="flex items-center justify-between p-3 border-b border-border/40 bg-muted/20">
                    <div>
                      <p className="text-sm font-bold">{MODULE_LABEL[mod]}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {pages.filter((p) => allowedInTeam.has(p.key)).length} / {pages.length} liberadas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{allOn ? 'Todas' : someOn ? 'Algumas' : 'Nenhuma'}</span>
                      <Switch checked={allOn} onCheckedChange={(v) => toggleModule(pages, v)} />
                    </div>
                  </div>
                  <div className="divide-y divide-border/30">
                    {pages.map((p) => {
                      const on = allowedInTeam.has(p.key);
                      const otherTeamHas = effectiveUnion.has(p.key) && !on;
                      return (
                        <div key={p.key} className="flex items-center justify-between p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.label}</p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">{p.path}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {otherTeamHas && (
                              <Badge variant="outline" className="text-[9px] gap-1">
                                <ShieldCheck className="w-3 h-3" /> outra equipe
                              </Badge>
                            )}
                            <Switch checked={on} onCheckedChange={(v) => toggle(p.key, v)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Efetivo (união entre equipes): <strong className="text-foreground">{liveUnion.size}</strong> / {PAGE_REGISTRY.length} páginas
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={save} disabled={saving || loading}>{saving ? 'Salvando...' : 'Salvar permissões'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Suprime warning de import não usado do Popover (mantido para futura extensão).
export const _keep = { Popover, PopoverContent, PopoverTrigger };
