import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Wifi, WifiOff,
  Database, Activity, AlertTriangle, PlayCircle, Power, MapPin, Zap,
} from 'lucide-react';

import { formatDateBR } from '@/lib/app-utils';


interface Run {
  id: string;
  entidade: string | null;
  status: string;
  started_at: string;
  finished_at: string | null;
  rows_processed: number | null;
  rows_upserted: number | null;
  error_message: string | null;
  triggered_by: string | null;
  detalhes: any;
}

const ENTIDADES = [
  { key: 'produtos', label: 'Produtos', mapped: true },
  { key: 'saldo', label: 'Saldo', mapped: true },
  { key: 'movimentacoes', label: 'Saídas', mapped: true },
  { key: 'entradas', label: 'Entradas', mapped: true },
  { key: 'transferencias', label: 'Transferências', mapped: true },
];

export default function AugeAdminPanel() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [ping, setPing] = useState<{ ok: boolean; latency?: number; error?: string; checkedAt?: string } | null>(null);
  const [pinging, setPinging] = useState(false);
  const [syncingEntity, setSyncingEntity] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [syncEnabled, setSyncEnabled] = useState<boolean>(true);
  const [togglingFlag, setTogglingFlag] = useState(false);

  const loadFlag = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'auge_sync_enabled')
      .maybeSingle();
    if (data) setSyncEnabled(!!data.enabled);
  }, []);

  const toggleFlag = async (next: boolean) => {
    setTogglingFlag(true);
    const prev = syncEnabled;
    setSyncEnabled(next);
    const { error } = await (supabase as any)
      .from('feature_flags')
      .update({ enabled: next })
      .eq('key', 'auge_sync_enabled');
    setTogglingFlag(false);
    if (error) {
      setSyncEnabled(prev);
      toast.error('Falha ao alterar: ' + error.message);
    } else {
      toast.success(next ? 'Sincronização com Auge ligada' : 'Sincronização com Auge desligada');
    }
  };


  const loadRuns = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('auge_sync_runs')
      .select('*').order('started_at', { ascending: false }).limit(50);
    setRuns((data as Run[]) || []);
    setLoading(false);
  }, []);

  const loadCounts = useCallback(async () => {
    const tables = ['auge_produtos', 'auge_produtos_saldo', 'auge_movimentacoes', 'auge_depositos', 'auge_lotes', 'auge_transferencias'];
    const out: Record<string, number> = {};
    await Promise.all(tables.map(async t => {
      const { count } = await (supabase as any).from(t).select('*', { count: 'exact', head: true });
      out[t] = count ?? 0;
    }));
    setCounts(out);
  }, []);

  const doPing = useCallback(async () => {
    setPinging(true);
    try {
      const t0 = Date.now();
      const { data, error } = await supabase.functions.invoke('auge-sync?action=ping');
      const latency = Date.now() - t0;
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      setPing({ ok: true, latency, checkedAt: new Date().toISOString() });
    } catch (e: any) {
      setPing({ ok: false, error: e.message, checkedAt: new Date().toISOString() });
    } finally { setPinging(false); }
  }, []);

  const syncOne = async (entity: string) => {
    setSyncingEntity(entity);
    const t = toast.loading(`Sincronizando ${entity}...`);
    try {
      const { data, error } = await supabase.functions.invoke(`auge-sync?entity=${entity}`);
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      const r = (data?.results ?? []).find((x: any) => x.entity === entity);
      if (r?.error) throw new Error(r.error);
      toast.success(`${r?.upserted ?? 0} registros de ${entity}`, { id: t });
      await Promise.all([loadRuns(), loadCounts()]);
    } catch (e: any) {
      toast.error(`${entity}: ${e.message}`, { id: t });
      await loadRuns();
    } finally { setSyncingEntity(null); }
  };

  const syncAll = async () => {
    setSyncingEntity('all');
    const t = toast.loading('Sincronizando tudo...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync');
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      toast.success(`${data?.upserted ?? 0} registros totais`, { id: t });
      await Promise.all([loadRuns(), loadCounts()]);
    } catch (e: any) {
      toast.error('Falha: ' + e.message, { id: t });
    } finally { setSyncingEntity(null); }
  };

  const syncTecidosMap = async () => {
    setSyncingEntity('tecidos_map');
    const t = toast.loading('Iniciando sincronização de tecidos (roda em background)...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=sync_tecidos_map', { method: 'POST' });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any).error);
      toast.success(
        'Sync iniciado em background. Acompanhe o progresso no histórico abaixo (leva ~1-3 min).',
        { id: t, duration: 6000 },
      );
      await loadRuns();
      // Recarrega periodicamente para acompanhar o run rodando
      let tries = 0;
      const iv = setInterval(async () => {
        tries++;
        await Promise.all([loadRuns(), loadCounts()]);
        if (tries >= 20) clearInterval(iv);
      }, 8000);
    } catch (e: any) {
      toast.error('Falha: ' + e.message, { id: t });
    } finally { setSyncingEntity(null); }
  };

  const syncEverything = async () => {
    setSyncingEntity('everything');
    const t = toast.loading('Sincronização completa iniciada — entidades, mapa, acabamentos e TAGs...');
    const results: string[] = [];
    const errors: string[] = [];
    try {
      // 1. Todas as entidades (produtos, saldo, movimentacoes, entradas, transferencias)
      try {
        const { data, error } = await supabase.functions.invoke('auge-sync');
        if (error) throw error;
        if (data?.ok === false) throw new Error(data.error);
        results.push(`Entidades: ${data?.upserted ?? 0} registros`);
      } catch (e: any) { errors.push(`Entidades: ${e.message}`); }

      // 2. Mapa de tecidos (background)
      try {
        const { data, error } = await supabase.functions.invoke('auge-sync?action=sync_tecidos_map', { method: 'POST' });
        if (error) throw error;
        if ((data as any)?.ok === false) throw new Error((data as any).error);
        results.push('Mapa de tecidos: iniciado em background');
      } catch (e: any) { errors.push(`Mapa tecidos: ${e.message}`); }

      // 3. Acabamentos (background)
      try {
        const { data, error } = await supabase.functions.invoke('auge-sync?action=sync_acabamentos', { body: {} });
        if (error) throw error;
        if (data?.ok === false) throw new Error(data.error);
        results.push('Acabamentos: iniciado em background');
      } catch (e: any) { errors.push(`Acabamentos: ${e.message}`); }

      // 4. Varredura de TAGs customizadas (incremental, background)
      try {
        const { data, error } = await supabase.functions.invoke('auge-sync?action=sync_tag_custom', { body: { full: false } });
        if (error) throw error;
        if (data?.ok === false) throw new Error(data.error);
        results.push('TAGs custom: varredura incremental iniciada');
      } catch (e: any) { errors.push(`TAGs custom: ${e.message}`); }

      // 5. TAGs calculadas (lista completa de /modInventario/tag/tag.php)
      try {
        const { data, error } = await supabase.functions.invoke('auge-sync?action=sync_tags_calculadas', { body: {} });
        if (error) throw error;
        if ((data as any)?.ok === false) throw new Error((data as any).error);
        results.push(`TAGs calculadas: ${(data as any)?.salvos ?? 0} sincronizadas`);
      } catch (e: any) { errors.push(`TAGs calculadas: ${e.message}`); }



      if (errors.length === 0) {
        toast.success(`Sincronização completa iniciada. ${results.length} rotinas disparadas.`, { id: t, duration: 6000 });
      } else if (results.length > 0) {
        toast.warning(`Parcial: ${results.length} OK, ${errors.length} com erro. Veja o histórico.`, { id: t, duration: 8000 });
        errors.forEach(msg => toast.error(msg));
      } else {
        toast.error(`Falha total. Primeiro erro: ${errors[0]}`, { id: t });
      }
      await Promise.all([loadRuns(), loadCounts()]);
      // acompanhamento periódico
      let tries = 0;
      const iv = setInterval(async () => {
        tries++;
        await Promise.all([loadRuns(), loadCounts()]);
        if (tries >= 30) clearInterval(iv);
      }, 8000);
    } finally { setSyncingEntity(null); }
  };




  useEffect(() => {
    loadRuns(); loadCounts(); doPing(); loadFlag();
    const iv = setInterval(loadRuns, 15000);
    return () => clearInterval(iv);
  }, [loadRuns, loadCounts, doPing, loadFlag]);


  // Stats do painel
  const last24h = runs.filter(r => new Date(r.started_at).getTime() > Date.now() - 24 * 3600 * 1000);
  const successRate = last24h.length ? Math.round((last24h.filter(r => r.status === 'success').length / last24h.length) * 100) : null;
  const lastByEntity = new Map<string, Run>();
  runs.forEach(r => { const k = r.entidade || 'all'; if (!lastByEntity.has(k)) lastByEntity.set(k, r); });

  return (
    <div className="space-y-5">
      {/* Chave mestre da sincronização */}
      <Card className={`p-5 rounded-md border-border/40 ${!syncEnabled ? 'border-amber-500/40 bg-amber-500/5' : ''}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syncEnabled ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              <Power className={`w-5 h-5 ${syncEnabled ? 'text-success' : 'text-warning'}`} />
            </div>
            <div>
              <Label htmlFor="auge-sync-toggle" className="font-semibold text-sm cursor-pointer">
                Sincronização com o Auge {syncEnabled ? 'ativa' : 'desligada'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {syncEnabled
                  ? 'Sync manual e agendado (cron) estão liberados.'
                  : 'Todos os sync — manual e cron — estão bloqueados até religar.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {togglingFlag && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <Switch
              id="auge-sync-toggle"
              checked={syncEnabled}
              onCheckedChange={toggleFlag}
              disabled={togglingFlag}
            />
          </div>
        </div>
      </Card>

      {/* Status da conexão */}
      <Card className="p-5 rounded-md border-border/40">

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {pinging ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : ping?.ok ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-success" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-destructive" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm">
                {pinging ? 'Verificando...' : ping?.ok ? 'Conectado ao Auge ERP' : 'Sem conexão'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {ping?.ok
                  ? `Login + /home OK · latência ${ping.latency}ms · verificado ${ping.checkedAt ? formatDateBR(ping.checkedAt) : ''}`
                  : ping?.error || 'unilux.auge.app'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={doPing} disabled={pinging} className="gap-1.5 h-9">
              <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
              Testar conexão
            </Button>
            <Button size="sm" variant="outline" asChild className="gap-1.5 h-9">
              <a href="/admin/har-transferencias"><Activity className="w-3.5 h-3.5" />Analisar HAR</a>
            </Button>
            <Button size="sm" variant="outline" asChild className="gap-1.5 h-9">
              <a href="/admin/depositos"><Activity className="w-3.5 h-3.5" />Gerir depósitos</a>
            </Button>
            <Button size="sm" variant="outline" onClick={syncTecidosMap} disabled={syncingEntity !== null || !syncEnabled} className="gap-1.5 h-9" title="Reconstrói /estoque/mapa a partir dos lotes do Auge">
              {syncingEntity === 'tecidos_map' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              Sincronizar mapa tecidos
            </Button>
            <Button size="sm" variant="outline" onClick={syncAll} disabled={syncingEntity !== null || !syncEnabled} title={!syncEnabled ? 'Sincronização desligada' : 'Apenas entidades (produtos, saldo, movimentações, entradas, transferências)'} className="gap-1.5 h-9">
              {syncingEntity === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
              Sincronizar entidades
            </Button>
            <Button
              size="sm"
              onClick={syncEverything}
              disabled={syncingEntity !== null || !syncEnabled}
              title={!syncEnabled ? 'Sincronização desligada' : 'Roda TUDO: entidades + mapa tecidos + acabamentos + TAGs custom'}
              className="gap-1.5 h-9 bg-primary hover:bg-primary/90"
            >
              {syncingEntity === 'everything' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              SINCRONIZAR TUDO
            </Button>


          </div>
        </div>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Activity} label="Runs últimas 24h" value={last24h.length} />
        <MetricCard icon={CheckCircle2} label="Taxa de sucesso" value={successRate != null ? `${successRate}%` : '—'} tone={successRate != null && successRate >= 95 ? 'emerald' : 'amber'} />
        <MetricCard icon={Clock} label="Última execução" value={runs[0] ? formatDateBR(runs[0].started_at) : '—'} small />
        <MetricCard icon={AlertTriangle} label="Erros 24h" value={last24h.filter(r => r.status === 'error').length} tone={last24h.filter(r => r.status === 'error').length > 0 ? 'red' : 'emerald'} />
      </div>

      {/* Sync por entidade */}
      <Card className="p-5 rounded-md border-border/40">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Entidades sincronizáveis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ENTIDADES.map(ent => {
            const last = lastByEntity.get(ent.key);
            const tableName = ent.key === 'saldo' ? 'auge_produtos_saldo' : ent.key === 'movimentacoes' ? 'auge_movimentacoes' : `auge_${ent.key}`;
            const count = counts[tableName] ?? 0;
            return (
              <div key={ent.key} className="border border-border/40 rounded-md p-3 bg-card/40 hover:border-border/60 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{ent.label}</span>
                      {!ent.mapped && <Badge variant="outline" className="text-[9px] border-amber-500/40 text-warning">experimental</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                      {count.toLocaleString('pt-BR')} registros
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => syncOne(ent.key)}
                    disabled={syncingEntity !== null || !syncEnabled} className="h-7 px-2 gap-1">
                    {syncingEntity === ent.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  </Button>
                </div>
                {last ? (
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {last.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-success" /> :
                      last.status === 'error' ? <XCircle className="w-3 h-3 text-destructive" /> :
                      <Loader2 className="w-3 h-3 animate-spin text-warning" />}
                    <span className="text-muted-foreground truncate">
                      {formatDateBR(last.started_at)} · {last.rows_upserted ?? 0} up
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/60 italic">Nunca sincronizado</p>
                )}
                {last?.error_message && (
                  <p className="text-[10px] text-destructive/80 mt-1 line-clamp-2" title={last.error_message}>
                    {last.error_message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Histórico */}
      <Card className="p-0 overflow-hidden rounded-md border-border/40">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Últimas 50 execuções
          </h3>
          <Badge variant="outline" className="text-[10px]">cron: 17 min de cada hora</Badge>
        </div>
        {loading ? (
          <Skeleton className="h-64" />
        ) : runs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma execução registrada.</p>
        ) : (
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2.5">Início</th>
                  <th className="p-2.5">Entidade</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Processados</th>
                  <th className="p-2.5 text-right">Upserted</th>
                  <th className="p-2.5">Duração</th>
                  <th className="p-2.5">Origem</th>
                  <th className="p-2.5">Erro</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(r => {
                  const dur = r.finished_at ? Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000) : null;
                  return (
                    <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                      <td className="p-2.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                        {formatDateBR(r.started_at)}
                      </td>
                      <td className="p-2.5"><Badge variant="outline" className="text-[10px]">{r.entidade || 'all'}</Badge></td>
                      <td className="p-2.5">
                        <Badge className={`text-[10px] ${
                          r.status === 'success' ? 'bg-emerald-500/10 text-success border-emerald-500/30' :
                          r.status === 'error' ? 'bg-red-500/10 text-destructive border-red-500/30' :
                          'bg-amber-500/10 text-warning border-amber-500/30'
                        }`}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-right font-mono">{r.rows_processed ?? '—'}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{r.rows_upserted ?? '—'}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">{dur != null ? `${dur}s` : '—'}</td>
                      <td className="p-2.5 text-muted-foreground">{r.triggered_by ? 'usuário' : 'cron'}</td>
                      <td className="p-2.5 text-destructive/80 max-w-[260px] truncate" title={r.error_message || ''}>
                        {r.error_message || ''}
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

function MetricCard({ icon: Icon, label, value, tone, small }: { icon: any; label: string; value: any; tone?: 'emerald' | 'amber' | 'red'; small?: boolean }) {
  const cls = tone === 'emerald' ? 'text-success' : tone === 'amber' ? 'text-warning' : tone === 'red' ? 'text-destructive' : 'text-foreground';
  return (
    <Card className="p-3 rounded-md border-border/40">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
        <Icon className="w-3 h-3" />{label}
      </div>
      <p className={`font-bold ${small ? 'text-sm font-mono' : 'text-2xl'} ${cls}`}>{value}</p>
    </Card>
  );
}
