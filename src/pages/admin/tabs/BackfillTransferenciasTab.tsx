import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw, Loader2, PlayCircle, CheckCircle2, XCircle,
  Database, ListChecks, AlertTriangle, Hash, Activity, Clock,
} from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';

interface RunRow {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  triggered_by: string | null;
  error_message: string | null;
  detalhes: any;
}

const PENDING_FILTER =
  'deposito_origem.is.null,deposito_destino.is.null,codigo_produto.is.null,descricao_produto.is.null,observacao.is.null,documento.is.null,nr_efetivacao.is.null';

export default function BackfillTransferenciasTab() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [countsLoading, setCountsLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('auge_sync_runs')
      .select('id,status,started_at,finished_at,triggered_by,error_message,detalhes')
      .eq('entidade', 'transferencias')
      .order('started_at', { ascending: false })
      .limit(20);
    const list = ((data as RunRow[]) || []).filter(
      (r) => r?.detalhes?.phase === 'backfill' || r?.detalhes?.phase === 'done',
    );
    setRuns(list);
    setLoading(false);
  }, []);

  const loadCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const [t, p] = await Promise.all([
        (supabase as any).from('auge_transferencias').select('*', { count: 'exact', head: true }),
        (supabase as any).from('auge_transferencias').select('*', { count: 'exact', head: true }).or(PENDING_FILTER),
      ]);
      setTotal(t.count ?? 0);
      setPending(p.count ?? 0);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  const startBackfill = async () => {
    setStarting(true);
    const t = toast.loading('Iniciando backfill de transferências...');
    try {
      const { data, error } = await supabase.functions.invoke(
        'auge-sync?action=transferencias_backfill',
        { method: 'POST' },
      );
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any).error);
      toast.success('Backfill iniciado em background.', { id: t, duration: 5000 });
      await Promise.all([loadRuns(), loadCounts()]);
    } catch (e: any) {
      toast.error('Falha: ' + e.message, { id: t });
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    loadRuns();
    loadCounts();
    const iv = setInterval(() => { loadRuns(); loadCounts(); }, 5000);
    const ch = (supabase as any)
      .channel('backfill-transf-runs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auge_sync_runs', filter: 'entidade=eq.transferencias' },
        () => loadRuns(),
      )
      .subscribe();
    return () => { clearInterval(iv); supabase.removeChannel(ch); };
  }, [loadRuns, loadCounts]);

  const current = useMemo(() => runs.find((r) => r.status === 'running') ?? runs[0], [runs]);
  const det = current?.detalhes ?? {};
  const processed = Number(det.processed ?? 0);
  const attempted = Number(det.attempted ?? 0);
  const enriched = Number(det.enriched ?? 0);
  const failed = Number(det.failed ?? 0);
  const lastId = det.last_id ?? null;
  const isRunning = current?.status === 'running';

  const doneCount = total != null && pending != null ? total - pending : null;
  const percent = total && total > 0 && doneCount != null ? Math.min(100, Math.round((doneCount / total) * 100)) : 0;

  return (
    <div className="space-y-5">
      {/* Header / ação */}
      <Card className="p-5 rounded-md border-border/40">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRunning ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
              {isRunning
                ? <Loader2 className="w-5 h-5 animate-spin text-warning" />
                : <ListChecks className="w-5 h-5 text-success" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                Backfill de Transferências {isRunning ? '· em execução' : '· ocioso'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Reprocessa linhas com campos faltantes buscando detalhes no Auge (idAcao=consulta).
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => { loadRuns(); loadCounts(); }} className="gap-1.5 h-9">
              <RefreshCw className={`w-3.5 h-3.5 ${countsLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={startBackfill} disabled={starting || isRunning} className="gap-1.5 h-9">
              {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
              {isRunning ? 'Já em execução' : 'Iniciar backfill'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Progresso global (dataset) */}
      <Card className="p-5 rounded-md border-border/40">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Progresso global do dataset
          </h4>
          <Badge variant="outline" className="text-[10px]">{percent}% completo</Badge>
        </div>
        <Progress value={percent} className="h-2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Stat icon={Database} label="Total de linhas" value={fmt(total)} />
          <Stat icon={CheckCircle2} label="Já preenchidas" value={fmt(doneCount)} tone="emerald" />
          <Stat icon={AlertTriangle} label="Pendentes" value={fmt(pending)} tone={pending && pending > 0 ? 'amber' : 'emerald'} />
          <Stat icon={Clock} label="Última atualização" value={current ? formatDateBR(current.started_at) : '—'} small />
        </div>
      </Card>

      {/* Progresso da run atual */}
      <Card className="p-5 rounded-md border-border/40">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Run em andamento
          </h4>
          {current ? (
            <Badge className={`text-[10px] ${
              current.status === 'success' ? 'bg-emerald-500/10 text-success border-emerald-500/30' :
              current.status === 'error' ? 'bg-red-500/10 text-destructive border-red-500/30' :
              'bg-amber-500/10 text-warning border-amber-500/30'
            }`}>{current.status}</Badge>
          ) : null}
        </div>
        {loading ? (
          <Skeleton className="h-24" />
        ) : !current ? (
          <p className="text-sm text-muted-foreground italic">Nenhuma run de backfill registrada ainda.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat icon={ListChecks} label="Processadas" value={fmt(processed)} />
              <Stat icon={Activity} label="Tentativas" value={fmt(attempted)} />
              <Stat icon={CheckCircle2} label="Enriquecidas" value={fmt(enriched)} tone="emerald" />
              <Stat icon={XCircle} label="Falhas" value={fmt(failed)} tone={failed > 0 ? 'red' : 'emerald'} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground font-mono break-all">
              <Hash className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">last_id:</span>
              <span className="text-foreground/80">{lastId || '—'}</span>
            </div>
            {det.sample_debug && (
              <div className="mt-3 p-3 rounded bg-destructive/5 border border-destructive/20">
                <p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">Amostra de falha</p>
                <pre className="text-[10px] whitespace-pre-wrap break-all text-destructive/80 font-mono max-h-40 overflow-auto">
                  {JSON.stringify(det.sample_debug, null, 2)}
                </pre>
              </div>
            )}
            {current.error_message && (
              <p className="mt-3 text-[11px] text-destructive/80">{current.error_message}</p>
            )}
          </>
        )}
      </Card>

      {/* Histórico */}
      <Card className="p-0 overflow-hidden rounded-md border-border/40">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Histórico de runs de backfill
          </h3>
          <Badge variant="outline" className="text-[10px]">últimas 20</Badge>
        </div>
        {loading ? (
          <Skeleton className="h-40" />
        ) : runs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma run de backfill registrada.</p>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2.5">Início</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Processadas</th>
                  <th className="p-2.5 text-right">Enriquecidas</th>
                  <th className="p-2.5 text-right">Falhas</th>
                  <th className="p-2.5">Duração</th>
                  <th className="p-2.5">Origem</th>
                  <th className="p-2.5">last_id</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const d = r.detalhes ?? {};
                  const dur = r.finished_at
                    ? Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000)
                    : Math.round((Date.now() - new Date(r.started_at).getTime()) / 1000);
                  return (
                    <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                      <td className="p-2.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                        {formatDateBR(r.started_at)}
                      </td>
                      <td className="p-2.5">
                        <Badge className={`text-[10px] ${
                          r.status === 'success' ? 'bg-emerald-500/10 text-success border-emerald-500/30' :
                          r.status === 'error' ? 'bg-red-500/10 text-destructive border-red-500/30' :
                          'bg-amber-500/10 text-warning border-amber-500/30'
                        }`}>{r.status}</Badge>
                      </td>
                      <td className="p-2.5 text-right font-mono">{fmt(d.processed)}</td>
                      <td className="p-2.5 text-right font-mono text-success">{fmt(d.enriched)}</td>
                      <td className="p-2.5 text-right font-mono text-destructive/80">{fmt(d.failed)}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">{dur != null ? `${dur}s` : '—'}</td>
                      <td className="p-2.5 text-muted-foreground">{r.triggered_by ? 'usuário' : 'cron'}</td>
                      <td className="p-2.5 font-mono text-[10px] text-muted-foreground max-w-[180px] truncate" title={d.last_id || ''}>
                        {d.last_id || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function fmt(v: number | null | undefined) {
  if (v == null) return '—';
  return Number(v).toLocaleString('pt-BR');
}

function Stat({
  icon: Icon, label, value, tone, small,
}: { icon: any; label: string; value: any; tone?: 'emerald' | 'amber' | 'red'; small?: boolean }) {
  const cls =
    tone === 'emerald' ? 'text-success' :
    tone === 'amber' ? 'text-warning' :
    tone === 'red' ? 'text-destructive' : 'text-foreground';
  return (
    <Card className="p-3 rounded-md border-border/40">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
        <Icon className="w-3 h-3" />{label}
      </div>
      <p className={`font-bold ${small ? 'text-sm font-mono' : 'text-2xl'} ${cls}`}>{value}</p>
    </Card>
  );
}
