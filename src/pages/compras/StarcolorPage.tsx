import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Plus, MoreVertical, ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, Calendar, Hash, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StarcolorStatus = 'aberta' | 'na_starcolor' | 'retornou' | 'finalizada';

interface StarcolorOP {
  id: string;
  numero_op: string;
  numero_nf: string | null;
  descricao: string | null;
  quantidade: number | null;
  status: StarcolorStatus;
  data_envio: string | null;
  data_retorno: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS: { key: StarcolorStatus; label: string; accent: string }[] = [
  { key: 'aberta',       label: 'Aberta',       accent: 'border-muted-foreground/40' },
  { key: 'na_starcolor', label: 'Na Starcolor', accent: 'border-amber-500/50' },
  { key: 'retornou',     label: 'Retornou',     accent: 'border-blue-500/50' },
  { key: 'finalizada',   label: 'Finalizada',   accent: 'border-emerald-500/50' },
];

const STATUS_ORDER: StarcolorStatus[] = ['aberta', 'na_starcolor', 'retornou', 'finalizada'];

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    const [y, m, d] = iso.split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch { return iso; }
}

// ------------------------- Data hooks -------------------------

function useStarcolorOps() {
  return useQuery({
    queryKey: ['compras', 'starcolor', 'ops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_starcolor_ops')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as StarcolorOP[];
    },
  });
}

// ------------------------- Form Dialog -------------------------

interface OPFormValues {
  numero_op: string;
  numero_nf: string;
  descricao: string;
  quantidade: string;
  status: StarcolorStatus;
  data_envio: string;
  data_retorno: string;
  observacoes: string;
}

const emptyForm: OPFormValues = {
  numero_op: '', numero_nf: '', descricao: '', quantidade: '',
  status: 'aberta', data_envio: '', data_retorno: '', observacoes: '',
};

function OPFormDialog({
  open, onOpenChange, editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: StarcolorOP | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<OPFormValues>(emptyForm);

  // sync when opening
  useMemo(() => {
    if (open) {
      if (editing) {
        setForm({
          numero_op: editing.numero_op ?? '',
          numero_nf: editing.numero_nf ?? '',
          descricao: editing.descricao ?? '',
          quantidade: editing.quantidade?.toString() ?? '',
          status: editing.status,
          data_envio: editing.data_envio ?? '',
          data_retorno: editing.data_retorno ?? '',
          observacoes: editing.observacoes ?? '',
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        numero_op: form.numero_op.trim(),
        numero_nf: form.numero_nf.trim() || null,
        descricao: form.descricao.trim() || null,
        quantidade: form.quantidade ? Number(form.quantidade) : null,
        status: form.status,
        data_envio: form.data_envio || null,
        data_retorno: form.data_retorno || null,
        observacoes: form.observacoes.trim() || null,
      };
      if (!payload.numero_op) throw new Error('Nº da OP é obrigatório.');
      if (editing) {
        const { error } = await supabase
          .from('compras_starcolor_ops')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('compras_starcolor_ops')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras', 'starcolor', 'ops'] });
      toast.success(editing ? 'OP atualizada' : 'OP criada');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message ?? 'Erro ao salvar'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar OP' : 'Nova OP Starcolor'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label>Nº da OP *</Label>
            <Input value={form.numero_op}
              onChange={e => setForm(f => ({ ...f, numero_op: e.target.value }))} />
          </div>
          <div className="col-span-1">
            <Label>Nº da NF</Label>
            <Input value={form.numero_nf}
              onChange={e => setForm(f => ({ ...f, numero_nf: e.target.value }))} />
          </div>

          <div className="col-span-2">
            <Label>Descrição</Label>
            <Input value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>

          <div className="col-span-1">
            <Label>Quantidade</Label>
            <Input type="number" inputMode="decimal" value={form.quantidade}
              onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} />
          </div>
          <div className="col-span-1">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={v => setForm(f => ({ ...f, status: v as StarcolorStatus }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLUMNS.map(c => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1">
            <Label>Data de envio</Label>
            <Input type="date" value={form.data_envio}
              onChange={e => setForm(f => ({ ...f, data_envio: e.target.value }))} />
          </div>
          <div className="col-span-1">
            <Label>Data de retorno</Label>
            <Input type="date" value={form.data_retorno}
              onChange={e => setForm(f => ({ ...f, data_retorno: e.target.value }))} />
          </div>

          <div className="col-span-2">
            <Label>Observações</Label>
            <Textarea rows={3} value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------- Card -------------------------

function OPCard({
  op, onEdit, onMove, onDelete,
}: {
  op: StarcolorOP;
  onEdit: (op: StarcolorOP) => void;
  onMove: (op: StarcolorOP, dir: -1 | 1) => void;
  onDelete: (op: StarcolorOP) => void;
}) {
  const idx = STATUS_ORDER.indexOf(op.status);
  const canPrev = idx > 0;
  const canNext = idx < STATUS_ORDER.length - 1;

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold truncate">
            <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {op.numero_op}
          </div>
          {op.numero_nf && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
              <FileText className="w-3 h-3 shrink-0" />
              NF {op.numero_nf}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(op)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(op)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {op.descricao && (
        <div className="text-xs text-muted-foreground line-clamp-2">{op.descricao}</div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {op.quantidade !== null && (
          <Badge variant="secondary" className="font-mono">
            {op.quantidade} un
          </Badge>
        )}
        {op.data_envio && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" /> env {formatDate(op.data_envio)}
          </span>
        )}
        {op.data_retorno && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" /> ret {formatDate(op.data_retorno)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost" size="sm" className="h-7 px-2"
          disabled={!canPrev}
          onClick={() => onMove(op, -1)}
          aria-label="Mover para trás"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost" size="sm" className="h-7 px-2"
          disabled={!canNext}
          onClick={() => onMove(op, 1)}
          aria-label="Avançar"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ------------------------- Page -------------------------

export default function StarcolorPage() {
  const qc = useQueryClient();
  const { data: ops = [], isLoading, isError, error } = useStarcolorOps();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StarcolorOP | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ops;
    return ops.filter(o =>
      o.numero_op?.toLowerCase().includes(q) ||
      o.numero_nf?.toLowerCase().includes(q) ||
      o.descricao?.toLowerCase().includes(q),
    );
  }, [ops, search]);

  const grouped = useMemo(() => {
    const map: Record<StarcolorStatus, StarcolorOP[]> = {
      aberta: [], na_starcolor: [], retornou: [], finalizada: [],
    };
    for (const o of filtered) map[o.status].push(o);
    return map;
  }, [filtered]);

  const moveMutation = useMutation({
    mutationFn: async ({ op, dir }: { op: StarcolorOP; dir: -1 | 1 }) => {
      const idx = STATUS_ORDER.indexOf(op.status);
      const next = STATUS_ORDER[idx + dir];
      if (!next) return;
      const patch: Partial<StarcolorOP> = { status: next };
      if (next === 'na_starcolor' && !op.data_envio) {
        patch.data_envio = new Date().toISOString().slice(0, 10);
      }
      if (next === 'retornou' && !op.data_retorno) {
        patch.data_retorno = new Date().toISOString().slice(0, 10);
      }
      const { error } = await supabase
        .from('compras_starcolor_ops')
        .update(patch)
        .eq('id', op.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras', 'starcolor', 'ops'] }),
    onError: (e: Error) => toast.error(e.message ?? 'Erro ao mover'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (op: StarcolorOP) => {
      const { error } = await supabase
        .from('compras_starcolor_ops')
        .delete()
        .eq('id', op.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras', 'starcolor', 'ops'] });
      toast.success('OP excluída');
    },
    onError: (e: Error) => toast.error(e.message ?? 'Erro ao excluir'),
  });

  const handleDelete = (op: StarcolorOP) => {
    if (confirm(`Excluir OP ${op.numero_op}?`)) deleteMutation.mutate(op);
  };

  return (
    <PageShell>
      <PageHeader
        title="Starcolor"
        subtitle="Controle de OPs e NFs enviadas para tingimento na Starcolor"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Nova OP
              </Button>
            </DialogTrigger>
          </Dialog>
        }
      />

      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por OP, NF ou descrição..."
          className="max-w-sm"
        />
        <div className="ml-auto text-xs text-muted-foreground tabular-nums">
          {ops.length} {ops.length === 1 ? 'OP' : 'OPs'} no total
        </div>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar OPs: {(error as Error)?.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {COLUMNS.map(col => {
          const items = grouped[col.key];
          return (
            <div
              key={col.key}
              className={cn(
                'rounded-lg border-t-2 bg-muted/30 border border-border flex flex-col min-h-[300px]',
                col.accent,
              )}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                <div className="text-xs font-semibold uppercase tracking-wider">{col.label}</div>
                <Badge variant="secondary" className="tabular-nums">{items.length}</Badge>
              </div>
              <div className="p-2 space-y-2 flex-1">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-md bg-muted animate-pulse" />
                  ))
                ) : items.length === 0 ? (
                  <div className="text-xs text-muted-foreground/70 text-center py-8">
                    Sem OPs
                  </div>
                ) : items.map(op => (
                  <OPCard
                    key={op.id}
                    op={op}
                    onEdit={(o) => { setEditing(o); setDialogOpen(true); }}
                    onMove={(o, dir) => moveMutation.mutate({ op: o, dir })}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <OPFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}
        editing={editing}
      />
    </PageShell>
  );
}
