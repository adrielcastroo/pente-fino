import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, PackageSearch, Ban, AlertTriangle, AlertOctagon, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePickings, type Picking } from '@/hooks/expedicao/useExpedicaoData';
import { EmptyState } from '@/components/ui/empty-state';
import { supabase } from '@/integrations/supabase/client';

import CancelPickingDialog from '@/components/expedicao/CancelPickingDialog';
import { PageShell, PageHeader, StatCard, StatusBadge } from '@/components/expedicao/ui';
import AlertsPanel from '@/components/expedicao/AlertsPanel';
import { useAuth } from '@/hooks/use-auth';
import { computeSla } from '@/lib/expedicao/sla';
import { syncToast } from '@/lib/toast-flows';

export default function PainelPage() {
  const { data, isLoading, refetch } = usePickings();
  const { can } = useAuth();
  const allowCancel = can('expedicao:cancel-picking');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSyncProduction = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    const tid = syncToast.iniciado('Produção do Auge');
    
    try {
      const { data: res, error } = await supabase.functions.invoke('auge-sync', {
        body: { action: 'expedicao_sync_prontos' }
      });
      
      if (error) throw error;
      
      syncToast.ok('Produção', res.count || 0, res.message, { id: tid });
      refetch();
    } catch (err) {
      syncToast.erro('Produção', err, { id: tid });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const [cancelTarget, setCancelTarget] = useState<Picking | null>(null);
  const [filter, setFilter] = useState('');
  const [tick, setTick] = useState(0);

  // Refresh SLA badges every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const slaList = useMemo(() => {
    void tick;
    return (data ?? []).map(p => ({ p, sla: computeSla(p.status, p.created_at) }));
  }, [data, tick]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return slaList;
    return slaList.filter(({ p }) =>
      p.numero.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      (p.cidade ?? '').toLowerCase().includes(q)
    );
  }, [slaList, filter]);

  const kpis = useMemo(() => {
    const arr = data ?? [];
    const late = slaList.filter(x => x.sla.level === 'late').length;
    const warn = slaList.filter(x => x.sla.level === 'warn').length;
    return {
      total: arr.length,
      aguardando: arr.filter(p => p.status === 'aguardando').length,
      em_andamento: arr.filter(p => ['em_separacao','em_conferencia'].includes(p.status)).length,
      atrasados: late,
      atencao: warn,
    };
  }, [data, slaList]);

  // Toast once when overdue pickings are detected
  const warnedRef = useRef(false);
  useEffect(() => {
    if (!warnedRef.current && kpis.atrasados > 0) {
      warnedRef.current = true;
      toast.warning(`${kpis.atrasados} picking(s) com SLA estourado`, {
        description: 'Verifique o painel — itens marcados como Atrasado.',
      });
    }
  }, [kpis.atrasados]);

  return (
    <PageShell>
      <div className="hidden">
        os dados precisam vir da seguinte pagina do auge:
        https://unilux.auge.app/record-manufactured-documents
      </div>
      <PageHeader
        title="Painel da expedição"
        subtitle="Pickings aguardando movimentação e conferência."
      />

      <AlertsPanel />

      {kpis.atrasados > 0 && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-md px-3 py-2 text-sm"
        >
          <AlertTriangle className="w-4 h-4" />
          <span><strong className="tabular-nums">{kpis.atrasados}</strong> picking(s) com SLA estourado</span>
          {kpis.atencao > 0 && (
            <span className="opacity-80">· {kpis.atencao} em atenção</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 tablet-portrait:gap-2">
        <StatCard label="Total" value={kpis.total} />
        <StatCard label="Aguardando" value={kpis.aguardando} variant="muted" />
        <StatCard label="Em andamento" value={kpis.em_andamento} variant="primary" />
        <StatCard
          label="Atenção"
          value={kpis.atencao}
          icon={kpis.atencao > 0 ? AlertTriangle : CheckCircle2}
          variant={kpis.atencao > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Atrasados"
          value={kpis.atrasados}
          icon={kpis.atrasados > 0 ? AlertOctagon : CheckCircle2}
          variant={kpis.atrasados > 0 ? 'destructive' : 'success'}
        />
      </div>

      <Input
        placeholder="Filtrar por número, cliente ou cidade..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="max-w-sm h-10"
      />

      <div className="bg-card border border-border rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Nenhum picking em andamento"
            description="Quando um pedido entrar em separação, ele aparece aqui com o SLA em tempo real."
          />
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="md:hidden divide-y divide-border">
              {filtered.map(({ p, sla }) => {
                const canCancel = allowCancel && !['faturado', 'cancelado'].includes(p.status);
                return (
                  <li key={p.id} className="p-3 flex flex-col gap-1.5 min-h-[64px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] text-muted-foreground truncate">{p.numero}</div>
                        <div className="font-semibold text-sm truncate">{p.cliente}</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {p.cidade && <span>{p.cidade}</span>}
                      {p.transportadora?.nome && <span>· {p.transportadora.nome}</span>}
                      {p.carrinho?.codigo && <span>· Carr. {p.carrinho.codigo}</span>}
                      <span className="ml-auto tabular-nums font-medium text-foreground">{p.total_pecas} pç</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {sla.level === 'none' ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Badge variant="outline" className={`${sla.cls} border-transparent text-[11px]`}>{sla.label}</Badge>
                      )}
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Cancelar picking"
                          className="h-11 min-w-11 text-muted-foreground hover:text-destructive"
                          onClick={() => setCancelTarget(p)}
                        >
                          <Ban className="size-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: tabela */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Carrinho</TableHead>
                  <TableHead className="text-right">Peças</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ p, sla }) => {
                  const canCancel = allowCancel && !['faturado', 'cancelado'].includes(p.status);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.numero}</TableCell>
                      <TableCell className="font-medium">{p.cliente}</TableCell>
                      <TableCell className="text-muted-foreground">{p.cidade ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{p.transportadora?.nome ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{p.carrinho?.codigo ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.total_pecas}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell>
                        {sla.level === 'none' ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge variant="outline" className={`${sla.cls} border-transparent text-[11px]`}>
                            {sla.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Cancelar picking"
                            className="size-8 text-muted-foreground hover:text-destructive"
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
          </>
        )}
      </div>

      
      <CancelPickingDialog
        picking={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      />
    </PageShell>
  );
}
