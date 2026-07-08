import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, ClipboardList, AlertTriangle, CalendarClock,
  PackageCheck, TrendingUp, ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageShell, PageHeader, StatCard } from '@/components/expedicao/ui';
import Seo from '@/components/Seo';
import { cn } from '@/lib/utils';

import {
  MOCK_OPS, STATUS_LABEL, STATUS_TONE, fmtBRL, fmtDate,
  diasParaEntrega, isAberta, isConcluida,
  type OpMock, type OpStatus,
} from './mockOps';

const STATUS_FILTER_OPTIONS: Array<{ value: 'todos' | OpStatus; label: string }> = [
  { value: 'todos', label: 'Todos os status' },
  ...(Object.keys(STATUS_LABEL) as OpStatus[]).map(s => ({ value: s, label: STATUS_LABEL[s] })),
];

const CATEGORIAS = ['todas', ...Array.from(new Set(MOCK_OPS.map(o => o.categoria)))];
const FORNECEDORES = ['todos', ...Array.from(new Set(MOCK_OPS.map(o => o.fornecedor)))];

export default function OpsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const status = (params.get('status') ?? 'todos') as 'todos' | OpStatus;
  const categoria = params.get('categoria') ?? 'todas';
  const fornecedor = params.get('fornecedor') ?? 'todos';
  const tab = params.get('view') ?? 'lista';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'todos' || value === 'todas' || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return MOCK_OPS.filter(op => {
      if (status !== 'todos' && op.status !== status) return false;
      if (categoria !== 'todas' && op.categoria !== categoria) return false;
      if (fornecedor !== 'todos' && op.fornecedor !== fornecedor) return false;
      if (term && !`${op.numero} ${op.fornecedor}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [q, status, categoria, fornecedor]);

  const kpis = useMemo(() => {
    const abertas = MOCK_OPS.filter(o => isAberta(o.status));
    const valorAberto = abertas.reduce((s, o) => s + o.valor_total, 0);
    const aVencer = abertas.filter(o => {
      const d = diasParaEntrega(o.data_prevista_entrega);
      return d >= 0 && d <= 7;
    }).length;
    const atrasadas = abertas.filter(o => diasParaEntrega(o.data_prevista_entrega) < 0).length;
    const parcial = MOCK_OPS.filter(o => o.status === 'recebimento_parcial').length;
    const concluidas30d = MOCK_OPS.filter(o => isConcluida(o.status));
    const noPrazo = concluidas30d.filter(o => diasParaEntrega(o.data_prevista_entrega) >= 0).length;
    const pctPrazo = concluidas30d.length
      ? Math.round((noPrazo / concluidas30d.length) * 100)
      : 0;
    return {
      abertas: abertas.length, valorAberto,
      aVencer, atrasadas, parcial, pctPrazo,
    };
  }, []);

  return (
    <>
      <Seo
        title="Acompanhamento de OPs — Compras | Pente Fino"
        description="Acompanhe ordens de compra, entregas previstas, recebimentos e SLA de fornecedores."
        path="/compras/ops"
      />

      <PageShell>
        <PageHeader
          title="Acompanhamento de OPs"
          subtitle="Ordens de compra em andamento, entregas previstas e recebimentos."
          actions={
            <Button className="font-semibold" disabled title="Em breve">
              <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} />
              Nova OC
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            label="OCs em aberto"
            value={kpis.abertas}
            icon={ClipboardList}
            variant="primary"
            hint={fmtBRL(kpis.valorAberto)}
          />
          <StatCard
            label="A vencer (7 dias)"
            value={kpis.aVencer}
            icon={CalendarClock}
            variant="warning"
          />
          <StatCard
            label="Em atraso"
            value={kpis.atrasadas}
            icon={AlertTriangle}
            variant={kpis.atrasadas > 0 ? 'destructive' : 'muted'}
          />
          <StatCard
            label="Recebimento parcial"
            value={kpis.parcial}
            icon={PackageCheck}
            variant="warning"
          />
          <StatCard
            label="Entregas no prazo"
            value={`${kpis.pctPrazo}%`}
            icon={TrendingUp}
            variant="success"
            hint="últimos 30 dias"
          />
        </div>

        {/* Filtros */}
        <Card className="rounded-md border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nº ou fornecedor"
                  className="pl-9 h-10 bg-background"
                  value={q}
                  onChange={(e) => setParam('q', e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={(v) => setParam('status', v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fornecedor} onValueChange={(v) => setParam('fornecedor', v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
                <SelectContent>
                  {FORNECEDORES.map(f => (
                    <SelectItem key={f} value={f}>{f === 'todos' ? 'Todos os fornecedores' : f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoria} onValueChange={(v) => setParam('categoria', v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c} value={c}>{c === 'todas' ? 'Todas as categorias' : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setParam('view', v === 'lista' ? '' : v)}>
          <TabsList>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="kanban" disabled title="Em breve">Kanban</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="mt-4">
            <ListaView ops={filtered} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <TimelineView ops={filtered} />
          </TabsContent>
        </Tabs>
      </PageShell>
    </>
  );
}

/* ---------------- Sub-views ---------------- */

function ListaView({ ops }: { ops: OpMock[] }) {
  const navigate = useNavigate();
  if (ops.length === 0) return <EmptyState />;
  return (
    <Card className="rounded-md border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Nº</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="hidden lg:table-cell">Prevista</TableHead>
            <TableHead className="w-[180px]">Progresso</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ops.map(op => {
            const pct = op.quantidade_total
              ? Math.min(100, Math.round((op.quantidade_recebida / op.quantidade_total) * 100))
              : 0;
            const dias = diasParaEntrega(op.data_prevista_entrega);
            const atrasada = isAberta(op.status) && dias < 0;
            return (
              <TableRow key={op.id} asChild>
                <Link to={`/compras/ops/${op.id}`} className="cursor-pointer hover:bg-muted/40">
                  <TableCell className="font-mono text-xs font-semibold">{op.numero}</TableCell>
                  <TableCell className="font-medium truncate max-w-[220px]">{op.fornecedor}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{op.categoria}</TableCell>
                  <TableCell>
                    <StatusBadge label={STATUS_LABEL[op.status]} tone={STATUS_TONE[op.status]} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtBRL(op.valor_total)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    <span className={cn('tabular-nums', atrasada && 'text-destructive font-semibold')}>
                      {fmtDate(op.data_prevista_entrega)}
                    </span>
                    {atrasada && <span className="ml-1 text-[10px] text-destructive">({Math.abs(dias)}d)</span>}
                  </TableCell>
                  <TableCell>
                    <ProgressBar pct={pct} tone={atrasada ? 'danger' : pct === 100 ? 'success' : 'primary'} />
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                </Link>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function TimelineView({ ops }: { ops: OpMock[] }) {
  if (ops.length === 0) return <EmptyState />;
  const buckets: Array<{ key: string; title: string; filter: (d: number) => boolean }> = [
    { key: 'atraso', title: 'Em atraso', filter: (d) => d < 0 },
    { key: 'hoje', title: 'Próximos 7 dias', filter: (d) => d >= 0 && d <= 7 },
    { key: 'mes', title: '8 a 30 dias', filter: (d) => d > 7 && d <= 30 },
    { key: 'futuro', title: 'Mais de 30 dias', filter: (d) => d > 30 },
  ];
  const abertas = ops.filter(o => isAberta(o.status));

  return (
    <div className="space-y-6">
      {buckets.map(b => {
        const list = abertas
          .filter(o => b.filter(diasParaEntrega(o.data_prevista_entrega)))
          .sort((a, b) => a.data_prevista_entrega.localeCompare(b.data_prevista_entrega));
        if (list.length === 0) return null;
        const atrasado = b.key === 'atraso';
        return (
          <section key={b.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                'text-xs font-bold uppercase tracking-[0.12em]',
                atrasado ? 'text-destructive' : 'text-muted-foreground',
              )}>
                {b.title}
              </h3>
              <span className="text-[10px] text-muted-foreground tabular-nums">({list.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map(op => {
                const pct = op.quantidade_total
                  ? Math.min(100, Math.round((op.quantidade_recebida / op.quantidade_total) * 100))
                  : 0;
                const dias = diasParaEntrega(op.data_prevista_entrega);
                return (
                  <Link
                    key={op.id}
                    to={`/compras/ops/${op.id}`}
                    className="block rounded-md border border-border bg-card p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-semibold">{op.numero}</div>
                        <div className="text-sm font-medium truncate">{op.fornecedor}</div>
                      </div>
                      <StatusBadge label={STATUS_LABEL[op.status]} tone={STATUS_TONE[op.status]} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {fmtDate(op.data_prevista_entrega)}
                        {atrasado && <span className="ml-1 text-destructive font-semibold">· {Math.abs(dias)}d atrás</span>}
                        {!atrasado && dias >= 0 && <span className="ml-1">· em {dias}d</span>}
                      </span>
                      <span className="tabular-nums font-semibold text-foreground">{fmtBRL(op.valor_total)}</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar pct={pct} tone={atrasado ? 'danger' : pct === 100 ? 'success' : 'primary'} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ProgressBar({ pct, tone }: { pct: number; tone: 'primary' | 'success' | 'danger' }) {
  const color =
    tone === 'success' ? 'bg-success'
    : tone === 'danger' ? 'bg-destructive'
    : 'bg-primary';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="rounded-md border-dashed border-border bg-card">
      <CardContent className="p-10 flex flex-col items-center text-center gap-2">
        <ClipboardList className="w-8 h-8 text-muted-foreground/60" />
        <div className="text-sm font-semibold text-foreground">Nenhuma OC encontrada</div>
        <p className="text-xs text-muted-foreground max-w-sm">
          Ajuste os filtros ou crie uma nova ordem de compra para começar o acompanhamento.
        </p>
      </CardContent>
    </Card>
  );
}
