import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useAppReleases, type AppRelease } from '@/hooks/useAppReleases';
import { BUMP_META, applyBump, codenameFor, diffBump } from '@/lib/version';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Rocket, Star, CheckCircle2, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export default function ReleasesPage() {
  const { isAdmin, loading, user } = useAuth();
  const { data: releases, isLoading } = useAppReleases();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '',
    notes: '',
    is_stable: false,
  });

  const create = useMutation({
    mutationFn: async () => {
      // Marca todas as outras como não-current
      await (supabase as any).from('app_releases').update({ is_current: false }).eq('is_current', true);
      const { error } = await (supabase as any).from('app_releases').insert({
        version: form.version.trim(),
        notes: form.notes || null,
        is_stable: form.is_stable,
        is_current: true,
        released_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Release registrada');
      setOpen(false);
      setForm({ ...form, notes: '', is_stable: false });
      qc.invalidateQueries({ queryKey: ['app_releases'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markStable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('app_releases').update({ is_stable: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Versão marcada como estável (referência de rollback)');
      qc.invalidateQueries({ queryKey: ['app_releases'] });
    },
  });

  const setCurrent = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from('app_releases').update({ is_current: false }).eq('is_current', true);
      const { error } = await (supabase as any).from('app_releases').update({ is_current: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rollback aplicado — banner aparecerá para usuários com bundle diferente');
      qc.invalidateQueries({ queryKey: ['app_releases'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('app_releases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app_releases'] }),
  });

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6" /> Releases
          </h1>
          <p className="text-sm text-muted-foreground">
            Histórico de versões publicadas. Marque estável para referência de rollback.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Registrar release</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar nova release</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Tamanho da atualização
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['patch', 'minor', 'major'] as const).map((b) => {
                    const base = releases?.[0]?.version ?? form.version ?? '0.0.0';
                    const next = applyBump(base, b);
                    return (
                      <Button
                        key={b}
                        type="button"
                        size="sm"
                        variant={form.version === next ? 'default' : 'outline'}
                        className="flex-col h-auto py-2 gap-0.5"
                        onClick={() => setForm({ ...form, version: next })}
                        title={BUMP_META[b].description}
                      >
                        <span className="text-[10px] uppercase tracking-wider font-bold">{BUMP_META[b].label}</span>
                        <span className="font-mono text-xs">v{next}</span>
                      </Button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Patch = correção · Minor = nova funcionalidade · Major = mudança ampla.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Versão</label>
                <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="3.18.0" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Codinome: <strong className="text-primary">{codenameFor(form.version)}</strong>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Notas</label>
                <Textarea rows={5} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="- Correção X&#10;- Nova funcionalidade Y" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_stable} onChange={(e) => setForm({ ...form, is_stable: e.target.checked })} />
                Marcar como estável
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={!form.version.trim() || create.isPending}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(() => {
        const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
        const currentBuildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null;
        const match = releases?.find(
          (r) =>
            r.version === currentVersion &&
            currentBuildTime &&
            r.build_time &&
            new Date(r.build_time).getTime() === new Date(currentBuildTime).getTime(),
        );
        return (
          <Card className={`p-4 border-l-4 ${match ? 'border-l-primary' : 'border-l-amber-500'}`}>
            <div className="flex items-start gap-3">
              {match ? (
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Build atual</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono">v{currentVersion ?? '?'}</span>
                  {currentBuildTime && (
                    <> · compilado em {new Date(currentBuildTime).toLocaleString('pt-BR')}</>
                  )}
                </p>
                {match ? (
                  <p className="text-xs mt-1">
                    Registrado em <strong>app_releases</strong> {formatRelative(match.updated_at ?? match.released_at)}
                    {' '}(<span className="text-muted-foreground">{new Date(match.updated_at ?? match.released_at).toLocaleString('pt-BR')}</span>).
                  </p>
                ) : (
                  <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">
                    Este build ainda não foi registrado. O registro é automático no primeiro acesso autenticado —
                    recarregue a página logado ou registre manualmente pelo botão acima.
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })()}



      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !releases?.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma release registrada.</Card>
      ) : (
        <div className="space-y-2">
          {releases.map((r: AppRelease, idx: number) => {
            const bump = diffBump(releases[idx + 1]?.version, r.version);
            const bumpMeta = BUMP_META[bump];
            return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-lg">v{r.version}</span>
                    <span className="text-sm font-medium text-primary">{codenameFor(r.version)}</span>
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-bold border ${bumpMeta.className}`} title={bumpMeta.description}>
                      {bumpMeta.label}
                    </Badge>
                    {r.is_current && <Badge className="bg-primary">Atual</Badge>}
                    {r.is_stable && <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> Estável</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(r.released_at).toLocaleString('pt-BR')}
                  </p>

                  {r.notes && (
                    <pre className="text-xs mt-2 whitespace-pre-wrap font-sans text-foreground/80">{r.notes}</pre>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {!r.is_stable && (
                    <Button size="sm" variant="ghost" onClick={() => markStable.mutate(r.id)}>
                      <Star className="h-3.5 w-3.5" /> Estável
                    </Button>
                  )}
                  {!r.is_current && (
                    <Button size="sm" variant="ghost" onClick={() => setCurrent.mutate(r.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Tornar atual
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => confirm(`Remover v${r.version}?`) && remove.mutate(r.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
            );
          })}

        </div>
      )}
    </div>
  );
}
