import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useFeatureFlags, type FeatureFlag } from '@/hooks/useFeatureFlag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const ROLES = ['admin', 'gerente', 'supervisor', 'operador'] as const;

export default function FeatureFlagsPage() {
  const { isAdmin, loading } = useAuth();
  const { data: flags, isLoading } = useFeatureFlags();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key: '', description: '', enabled: false, rollout_roles: [] as string[] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('feature_flags').insert({
        key: form.key.trim().toLowerCase().replace(/\s+/g, '_'),
        description: form.description || null,
        enabled: form.enabled,
        rollout_roles: form.rollout_roles,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Flag criada');
      setOpen(false);
      setForm({ key: '', description: '', enabled: false, rollout_roles: [] });
      qc.invalidateQueries({ queryKey: ['feature_flags'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from('feature_flags').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature_flags'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('feature_flags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Flag removida');
      qc.invalidateQueries({ queryKey: ['feature_flags'] });
    },
  });

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6" /> Feature Flags
          </h1>
          <p className="text-sm text-muted-foreground">
            Ligue ou desligue funcionalidades em tempo real sem redeploy.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Nova flag</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova feature flag</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Chave</label>
                <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="ex: nova_tela_estoque" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Descrição</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Rollout por papel (vazio = todos)</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const active = form.rollout_roles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm({
                          ...form,
                          rollout_roles: active ? form.rollout_roles.filter((x) => x !== r) : [...form.rollout_roles, r],
                        })}
                        className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
                <span className="text-sm">Ativa ao criar</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={!form.key.trim() || create.isPending}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !flags?.length ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma flag cadastrada.</Card>
      ) : (
        <div className="space-y-2">
          {flags.map((f: FeatureFlag) => (
            <Card key={f.id} className="p-4 flex items-center gap-4">
              <Switch
                checked={f.enabled}
                onCheckedChange={(v) => toggle.mutate({ id: f.id, enabled: v })}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono font-semibold">{f.key}</code>
                  {f.rollout_roles?.length > 0 && f.rollout_roles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                  ))}
                </div>
                {f.description && <p className="text-xs text-muted-foreground mt-1">{f.description}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => confirm(`Remover flag "${f.key}"?`) && remove.mutate(f.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
