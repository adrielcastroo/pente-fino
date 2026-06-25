import { useMemo, useState } from 'react';
import { Loader2, Search, Undo2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePickings, type Picking, type PickingStatus } from '@/hooks/expedicao/useExpedicaoData';
import CancelPickingDialog from '@/components/expedicao/CancelPickingDialog';

const STATUS_LABEL: Record<PickingStatus, string> = {
  aguardando: 'Aguardando',
  em_separacao: 'Em separação',
  em_conferencia: 'Em conferência',
  conferido: 'Conferido',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
};

const STATUS_TONE: Record<PickingStatus, string> = {
  aguardando: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  em_separacao: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  em_conferencia: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  conferido: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
  faturado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  cancelado: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
};

type Filter = 'todos' | 'faturado' | 'cancelado';

export default function HistoricoPage() {
  const { data, isLoading } = usePickings();
  const [filter, setFilter] = useState<Filter>('faturado');
  const [search, setSearch] = useState('');
  const [estornoTarget, setEstornoTarget] = useState<Picking | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? [])
      .filter((p) => (filter === 'todos' ? ['faturado', 'cancelado'].includes(p.status) : p.status === filter))
      .filter(
        (p) =>
          !q ||
          p.numero.toLowerCase().includes(q) ||
          p.cliente.toLowerCase().includes(q) ||
          (p.transportadora?.nome ?? '').toLowerCase().includes(q),
      );
  }, [data, filter, search]);

  const totals = useMemo(() => {
    const all = data ?? [];
    return {
      faturado: all.filter((p) => p.status === 'faturado').length,
      cancelado: all.filter((p) => p.status === 'cancelado').length,
      pecas: rows.reduce((s, p) => s + (p.total_pecas ?? 0), 0),
    };
  }, [data, rows]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
          <p className="text-sm text-muted-foreground">
            Pickings finalizados ·{' '}
            <span className="font-mono">{rows.length}</span> registros ·{' '}
            <span className="font-mono">{totals.pecas}</span> peças
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['faturado', 'cancelado', 'todos'] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'todos' ? 'Todos' : STATUS_LABEL[f as PickingStatus]}
              {f === 'faturado' && (
                <Badge variant="secondary" className="ml-2 font-mono">
                  {totals.faturado}
                </Badge>
              )}
              {f === 'cancelado' && (
                <Badge variant="secondary" className="ml-2 font-mono">
                  {totals.cancelado}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, cliente ou transportadora"
          className="h-10 pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando…
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum picking encontrado para os filtros selecionados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Picking</th>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">Transportadora</th>
                <th className="px-3 py-2 text-left">Cidade</th>
                <th className="px-3 py-2 text-right">Peças</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Finalizado</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-accent/40">
                  <td className="px-3 py-2 font-mono">{p.numero}</td>
                  <td className="px-3 py-2">{p.cliente}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.transportadora?.nome ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.cidade ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.total_pecas ?? 0}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_TONE[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.finished_at
                      ? new Date(p.finished_at).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {p.status === 'faturado' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setEstornoTarget(p)}
                      >
                        <Undo2 className="size-3.5 mr-1" /> Estornar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CancelPickingDialog
        picking={estornoTarget}
        open={!!estornoTarget}
        onOpenChange={(o) => !o && setEstornoTarget(null)}
      />
    </div>
  );
}
