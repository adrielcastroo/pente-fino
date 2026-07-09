import { useMemo, useState } from 'react';
import { PackageSearch, Clock, CheckCircle2, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageShell, PageHeader, StatCard } from '@/components/compras/ui';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useComprasPedidos,
  useComprasPedidosKpis,
  type ComprasPedidoStatus,
} from '@/hooks/compras/useComprasPedidos';

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<ComprasPedidoStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  recebido: 'Recebido',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
};

const STATUS_VARIANT: Record<ComprasPedidoStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente: 'outline',
  em_andamento: 'secondary',
  recebido: 'default',
  atrasado: 'destructive',
  cancelado: 'outline',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pt-BR');
  } catch { return iso; }
}

function formatCurrency(v: number | null) {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AcompanhamentosPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, error } = useComprasPedidos({
    page,
    pageSize: PAGE_SIZE,
    search,
  });
  const { data: kpis } = useComprasPedidosKpis();

  const totalPages = useMemo(() => {
    if (!data?.total) return 1;
    return Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  }, [data?.total]);

  const rows = data?.rows ?? [];

  return (
    <PageShell>
      <PageHeader
        title="Acompanhamentos"
        subtitle="Pedidos de compra em curso e previsões de recebimento"
      />




      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total" value={kpis?.total ?? 0} icon={PackageSearch} />
        <StatCard label="Pendentes" value={kpis?.pendentes ?? 0} icon={Clock} variant="muted" />
        <StatCard label="Em andamento" value={kpis?.em_andamento ?? 0} icon={PackageSearch} variant="primary" />
        <StatCard label="Atrasados" value={kpis?.atrasados ?? 0} icon={AlertTriangle} variant="destructive" />
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por número ou fornecedor..."
          className="max-w-sm"
        />
        {isFetching && !isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="tabular-nums">Itens</TableHead>
              <TableHead className="tabular-nums">Valor</TableHead>
              <TableHead>Previsão</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full max-w-[140px] rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-destructive text-sm">
                  Erro ao carregar pedidos: {(error as Error)?.message ?? 'desconhecido'}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 opacity-40" />
                    <span className="text-sm">
                      {search.trim()
                        ? 'Nenhum pedido corresponde à busca.'
                        : 'Nenhum pedido em acompanhamento no momento.'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.numero}</TableCell>
                  <TableCell>{p.fornecedor}</TableCell>
                  <TableCell className="tabular-nums">{p.itens}</TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(p.valor_total)}</TableCell>
                  <TableCell>{formatDate(p.previsao)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {data?.total ?? 0} {data?.total === 1 ? 'pedido' : 'pedidos'}
          {data?.total ? ` · página ${page} de ${totalPages}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
