import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Warehouse, Plus, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
import Seo from '@/components/Seo';

type Deposito = {
  id: string;
  codigo: string;
  nome: string | null;
  localizacao: string | null;
  tipo: string | null;
  empresa: string | null;
  filial: string | null;
  ativo: boolean;
  synced_at: string | null;
};

const EMPTY: Partial<Deposito> = { codigo: '', nome: '', localizacao: '', tipo: '', empresa: '', filial: '', ativo: true };

export default function DepositosAdminPage() {
  const [rows, setRows] = useState<Deposito[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Deposito> | null>(null);
  const [deleting, setDeleting] = useState<Deposito | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('auge_depositos').select('*').order('codigo');
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.codigo?.trim()) { toast.error('Código é obrigatório'); return; }
    setSaving(true);
    const payload = {
      codigo: editing.codigo!.trim().toUpperCase(),
      nome: editing.nome?.trim() || null,
      localizacao: editing.localizacao?.trim() || null,
      tipo: editing.tipo?.trim() || null,
      empresa: editing.empresa?.trim() || null,
      filial: editing.filial?.trim() || null,
      ativo: editing.ativo ?? true,
      synced_at: new Date().toISOString(),
    };
    const q = editing.id
      ? (supabase as any).from('auge_depositos').update(payload).eq('id', editing.id)
      : (supabase as any).from('auge_depositos').insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? 'Depósito atualizado' : 'Depósito criado');
    setEditing(null);
    load();
  };

  const remove = async () => {
    if (!deleting) return;
    const { error } = await (supabase as any).from('auge_depositos').delete().eq('id', deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Depósito removido');
    setDeleting(null);
    load();
  };

  const sync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando depósitos com Auge...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?entity=depositos');
      if (error) throw error;
      const r = (data?.results ?? []).find((x: any) => x.entity === 'depositos');
      if (r?.error) throw new Error(r.error);
      toast.success(`${r?.upserted ?? 0} depósitos sincronizados`, { id: t });
      load();
    } catch (e: any) {
      toast.error('Falha: ' + (e.message || ''), { id: t });
    } finally { setSyncing(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <Seo title="Depósitos | Admin" description="Gerenciamento de depósitos do Auge." />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Depósitos</h1>
            <p className="text-xs text-muted-foreground">Gestão dos depósitos do Auge (somente admin).</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sync} disabled={syncing} className="h-10 gap-2">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sincronizar
          </Button>
          <Button onClick={() => setEditing({ ...EMPTY })} className="h-10 gap-2">
            <Plus className="w-4 h-4" />Novo depósito
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Warehouse className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum depósito cadastrado.</p>
            <Button size="sm" onClick={() => setEditing({ ...EMPTY })} className="gap-2">
              <Plus className="w-4 h-4" />Criar primeiro
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Empresa / Filial</TableHead>
                <TableHead className="w-[80px] text-center">Ativo</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{r.codigo}</TableCell>
                  <TableCell className="text-sm">{r.nome || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.localizacao || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[r.empresa, r.filial].filter(Boolean).join(' / ') || '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={r.ativo ? 'default' : 'outline'} className="text-[10px]">
                      {r.ativo ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(r)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleting(r)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!editing} onOpenChange={v => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar depósito' : 'Novo depósito'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Código *</Label>
                <Input value={editing.codigo || ''} onChange={e => setEditing({ ...editing, codigo: e.target.value })} disabled={!!editing.id} className="h-10 font-mono uppercase" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Nome</Label>
                <Input value={editing.nome || ''} onChange={e => setEditing({ ...editing, nome: e.target.value })} className="h-10" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Localização</Label>
                <Input value={editing.localizacao || ''} onChange={e => setEditing({ ...editing, localizacao: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Input value={editing.tipo || ''} onChange={e => setEditing({ ...editing, tipo: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">Empresa</Label>
                <Input value={editing.empresa || ''} onChange={e => setEditing({ ...editing, empresa: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">Filial</Label>
                <Input value={editing.filial || ''} onChange={e => setEditing({ ...editing, filial: e.target.value })} className="h-10" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={editing.ativo ?? true} onCheckedChange={v => setEditing({ ...editing, ativo: v })} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={v => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover depósito {deleting?.codigo}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Registros de saldo, lotes e movimentações que referenciam este código continuarão existindo, mas ficarão órfãos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
