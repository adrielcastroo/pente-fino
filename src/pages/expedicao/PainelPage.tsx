import { useMemo, useState } from 'react';
import { Plus, Loader2, PackageSearch, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePickings, type Picking, type PickingStatus } from '@/hooks/expedicao/useExpedicaoData';
import NovoPickingDialog from '@/components/expedicao/NovoPickingDialog';
import CancelPickingDialog from '@/components/expedicao/CancelPickingDialog';

const STATUS_LABEL: Record<PickingStatus, { label: string; cls: string }> = {
  aguardando:     { label: 'Aguardando',     cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  em_separacao:   { label: 'Em separação',   cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  em_conferencia: { label: 'Em conferência', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  conferido:      { label: 'Conferido',      cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
  faturado:       { label: 'Faturado',       cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  cancelado:      { label: 'Cancelado',      cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
};

export default function PainelPage() {
  const { data, isLoading } = usePickings();
  const [novo, setNovo] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Picking | null>(null);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(p =>
      p.numero.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      (p.cidade ?? '').toLowerCase().includes(q)
    );
  }, [data, filter]);

  const kpis = useMemo(() => {
    const arr = data ?? [];
    return {
      total: arr.length,
      aguardando: arr.filter(p => p.status === 'aguardando').length,
      em_andamento: arr.filter(p => ['em_separacao','em_conferencia'].includes(p.status)).length,
      conferidos: arr.filter(p => p.status === 'conferido').length,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Painel da expedição</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pickings aguardando movimentação e conferência.
          </p>
        </div>
        <Button onClick={() => setNovo(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo picking
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ['Total', kpis.total],
          ['Aguardando', kpis.aguardando],
          ['Em andamento', kpis.em_andamento],
          ['Conferidos', kpis.conferidos],
        ] as const).map(([label, value]) => (
          <div key={label} className="bg-card border border-border rounded-md p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <Input
        placeholder="Filtrar por número, cliente ou cidade..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="bg-card border border-border rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <PackageSearch className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Nenhum picking encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre o primeiro picking para começar.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Carrinho</TableHead>
                <TableHead className="text-right">Peças</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => {
                const s = STATUS_LABEL[p.status];
                const canCancel = !['faturado', 'cancelado'].includes(p.status);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.numero}</TableCell>
                    <TableCell className="font-medium">{p.cliente}</TableCell>
                    <TableCell className="text-muted-foreground">{p.cidade ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.transportadora?.nome ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.carrinho?.codigo ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.total_pecas}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${s.cls} border-transparent`}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          title="Cancelar picking"
                          onClick={() => setCancelTarget(p)}
                        >
                          <Ban className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <NovoPickingDialog open={novo} onOpenChange={setNovo} />
      <CancelPickingDialog
        picking={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      />
    </div>
  );
}
