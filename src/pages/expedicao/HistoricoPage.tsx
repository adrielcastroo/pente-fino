import { useMemo, useState } from 'react';
import { Loader2, Search, Undo2, History } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePickings, type Picking, type PickingStatus } from '@/hooks/expedicao/useExpedicaoData';
import CancelPickingDialog from '@/components/expedicao/CancelPickingDialog';
import { PageShell, PageHeader, StatusBadge } from '@/components/expedicao/ui';
import { useAuth } from '@/hooks/use-auth';

const STATUS_LABEL: Record<PickingStatus, string> = {
  aguardando: 'Aguardando',
  em_separacao: 'Em separação',
  em_conferencia: 'Em conferência',
  conferido: 'Conferido',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
};

type Filter = 'todos' | 'faturado' | 'cancelado';

export default function HistoricoPage() {
  const { data, isLoading } = usePickings();
  const { can } = useAuth();
  const allowEstorno = can('expedicao:estorno-faturado');
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
    <PageShell>
      <PageHeader
        title="Histórico"
        subtitle={`Pickings finalizados · ${rows.length} registros · ${totals.pecas} peças`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {(['faturado', 'cancelado', 'todos'] as Filter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                className="h-9"
                onClick={() => setFilter(f)}
              >
                {f === 'todos' ? 'Todos' : STATUS_LABEL[f as PickingStatus]}
                {f === 'faturado' && (
                  <Badge variant="secondary" className="ml-2 font-mono tabular-nums">
                    {totals.faturado}
                  </Badge>
                )}
                {f === 'cancelado' && (
                  <Badge variant="secondary" className="ml-2 font-mono tabular-nums">
                    {totals.cancelado}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        }
      />

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
        <div className="rounded-md border border-dashed border-border">
          <EmptyState
            icon={History}
            title="Nenhum picking neste filtro"
            description="Ajuste o período, o status ou o termo de busca para encontrar movimentações anteriores."
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
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
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.finished_at
                      ? new Date(p.finished_at).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {p.status === 'faturado' && allowEstorno && (
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
    </PageShell>
  );
}
