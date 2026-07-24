import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Search, Loader2, ArrowDownAZ, ArrowUpAZ, AlertTriangle,
  RefreshCw, CheckCircle2, Tag as TagIcon, Filter, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface ScanRow {
  cd_configuracao: string;
  nm_configuracao: string | null;
  qtd_tags: number;
  last_scanned_at: string | null;
  erro: string | null;
}
interface TagRow {
  cd_configuracao: string;
  ds_tag_customizada: string | null;
  ds_tag_calculada: string | null;
  ds_tag_texto: string | null;
}
interface SyncRun {
  id: string;
  status: string;
  error_message: string | null;
  detalhes: {
    phase?: string; current?: number; total?: number;
    com_tag?: number; sem_tag?: number; errors?: number;
    cfg_count?: number;
    hits?: number; local_count?: number; missing_count?: number; extras_count?: number;
    coverage_pct?: number; missing_sample?: string[]; extras_sample?: string[];
    stage?: string;
  } | null;
}

type Filtro = 'sem_tag' | 'com_tag' | 'todos';

export default function TagsTab() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('sem_tag');
  const [sortBy, setSortBy] = useState<'nome' | 'codigo' | 'qtd'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [syncing, setSyncing] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [run, setRun] = useState<SyncRun | null>(null);
  const [auditRun, setAuditRun] = useState<SyncRun | null>(null);
  const channelRef = useRef<any>(null);
  const auditChannelRef = useRef<any>(null);
  const rowsChannelRef = useRef<any>(null);
  const runIsActive = run?.status === 'running';
  const auditIsActive = auditRun?.status === 'running';
  const shouldPoll = syncing || runIsActive;

  // Lista escaneada de configurações do Auge (via Tag-Custom)
  const { data: scanRows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['auge-tag-custom-scan'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_tag_custom_scan')
        .select('cd_configuracao, nm_configuracao, qtd_tags, last_scanned_at, erro')
        .order('nm_configuracao', { ascending: true })
        .limit(50000);
      return (data ?? []) as ScanRow[];
    },
    refetchInterval: shouldPoll ? 1000 : false,
  });

  // Tags agregadas por configuração (para exibir preview quando "COM TAG")
  const { data: tagsByCfg = {}, refetch: refetchTags } = useQuery({
    queryKey: ['auge-tag-custom-map'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_tag_custom')
        .select('cd_configuracao, ds_tag_customizada, ds_tag_calculada, ds_tag_texto')
        .limit(50000);
      const map: Record<string, TagRow[]> = {};
      for (const r of (data ?? []) as TagRow[]) {
        (map[r.cd_configuracao] ??= []).push(r);
      }
      return map;
    },
    refetchInterval: shouldPoll ? 2000 : false,
  });

  useEffect(() => {
    const ch = supabase
      .channel('tag-custom-scan-live')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'auge_tag_custom_scan' },
        () => refetch(),
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'auge_tag_custom' },
        () => refetchTags(),
      )
      .subscribe();
    rowsChannelRef.current = ch;

    // Auto-detecta varredura já em andamento (iniciada em outra aba/sessão)
    (async () => {
      const { data } = await (supabase as any)
        .from('auge_sync_runs')
        .select('*')
        .eq('entidade', 'tag_custom')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && data.status === 'running') {
        setRun(data as SyncRun);
        setSyncing(true);
        subscribeRun(data.id);
        refetch();
        refetchTags();
      }
    })();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (rowsChannelRef.current) supabase.removeChannel(rowsChannelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribeRun = (runId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`tag-custom-sync-${runId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auge_sync_runs', filter: `id=eq.${runId}` },
        (p: any) => {
          setRun(p.new as SyncRun);
          refetch();
          refetchTags();
          if (p.new?.status === 'success' || p.new?.status === 'error') {
            setSyncing(false);
            if (p.new?.status === 'success') {
              toast.success('Varredura de TAGs concluída.');
              refetch();
            } else {
              toast.error(p.new?.error_message ?? 'Falha na varredura.');
            }
          }
        }
      )
      .subscribe();
    channelRef.current = ch;
  };

  const varrerAuge = async () => {
    setSyncing(true);
    setRun(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        'auge-sync?action=sync_tag_custom', { body: {} }
      );
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error ?? 'Erro ao iniciar varredura.');
      if (data?.run_id) {
        await refetch();
        await refetchTags();
        const { data: initial } = await (supabase as any)
          .from('auge_sync_runs').select('*').eq('id', data.run_id).maybeSingle();
        if (initial) setRun(initial as SyncRun);
        subscribeRun(data.run_id);
        toast.info('Varredura iniciada. Isso pode levar alguns minutos…');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao iniciar varredura.');
      setSyncing(false);
    }
  };

  const totais = useMemo(() => {
    const totalScan = scanRows.length;
    const semTag = scanRows.filter(r => r.qtd_tags === 0 && !r.erro).length;
    const comTag = scanRows.filter(r => r.qtd_tags > 0).length;
    const errors = scanRows.filter(r => !!r.erro).length;
    return { totalScan, semTag, comTag, errors };
  }, [scanRows]);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    let arr = scanRows.filter(r => {
      if (filtro === 'sem_tag' && r.qtd_tags !== 0) return false;
      if (filtro === 'com_tag' && r.qtd_tags === 0) return false;
      if (t) {
        return (r.nm_configuracao ?? '').toLowerCase().includes(t) ||
               (r.cd_configuracao ?? '').toLowerCase().includes(t);
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'nome') cmp = (a.nm_configuracao ?? '').localeCompare(b.nm_configuracao ?? '', 'pt-BR', { sensitivity: 'base' });
      else if (sortBy === 'codigo') cmp = (a.cd_configuracao ?? '').localeCompare(b.cd_configuracao ?? '', 'pt-BR', { sensitivity: 'base' });
      else cmp = a.qtd_tags - b.qtd_tags;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [scanRows, busca, filtro, sortBy, sortDir]);

  const total = run?.detalhes?.total ?? 0;
  const current = run?.detalhes?.current ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const isActive = runIsActive;

  const toggleSort = (col: 'nome' | 'codigo' | 'qtd') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Escaneadas</div>
            <div className="text-lg font-semibold font-mono">{totais.totalScan}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Sem TAG</div>
            <div className="text-lg font-semibold font-mono text-destructive">{totais.semTag}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Com TAG</div>
            <div className="text-lg font-semibold font-mono text-emerald-500">{totais.comTag}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Erros</div>
            <div className="text-lg font-semibold font-mono text-amber-500">{totais.errors}</div>
          </div>
        </div>
      </Card>

      {run && (
        <Card className="p-3 border-primary/40 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            {isActive ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> :
              run.status === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive" /> :
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            <div className="text-xs font-semibold">
              {isActive ? `Varrendo Auge… ${run.detalhes?.phase ?? ''}` :
                run.status === 'error' ? 'Falhou' : 'Concluído'}
            </div>
            <div className="ml-auto text-[11px] font-mono text-muted-foreground">
              {current}/{total} · {run.detalhes?.cfg_count ?? totais.totalScan} config. · {run.detalhes?.com_tag ?? 0} c/tag · {run.detalhes?.sem_tag ?? 0} s/tag
            </div>
          </div>
          <Progress value={pct} className="h-2" />
          {run.status === 'error' && run.error_message && (
            <div className="mt-2 text-[11px] text-destructive">{run.error_message}</div>
          )}
        </Card>
      )}

      <Card className="p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por configuração ou código (ex.: CC000004)…"
              className="h-9 pl-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            {(['sem_tag', 'com_tag', 'todos'] as Filtro[]).map(f => (
              <Button
                key={f}
                size="sm"
                variant={filtro === f ? 'default' : 'ghost'}
                onClick={() => setFiltro(f)}
                className="h-7 text-[10px] px-2"
              >
                {f === 'sem_tag' ? 'Sem TAG' : f === 'com_tag' ? 'Com TAG' : 'Todos'}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={varrerAuge} disabled={syncing || isActive} className="h-9 gap-2 text-[11px]">
            {syncing || isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Varrer Auge
          </Button>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="h-9 gap-2 text-[11px]">
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Recarregar
          </Button>
        </div>

        <div className="overflow-auto max-h-[70vh] rounded border">
          <table className="w-full text-xs">
            <thead className="bg-muted sticky top-0 z-10">
              <tr className="text-left">
                <th className="p-2 cursor-pointer select-none" onClick={() => toggleSort('nome')}>
                  <div className="flex items-center gap-1">
                    Configuração
                    {sortBy === 'nome' && (sortDir === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="p-2 cursor-pointer select-none" onClick={() => toggleSort('codigo')}>
                  <div className="flex items-center gap-1">
                    Código
                    {sortBy === 'codigo' && (sortDir === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="p-2 cursor-pointer select-none" onClick={() => toggleSort('qtd')}>
                  <div className="flex items-center gap-1">
                    TAGs
                    {sortBy === 'qtd' && (sortDir === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="p-2">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>
              )}
              {lista.map((r) => {
                const tags = tagsByCfg[r.cd_configuracao] ?? [];
                return (
                  <tr key={r.cd_configuracao} className="border-t align-top hover:bg-muted/50">
                    <td className="p-2">
                      <div className="font-medium">{r.nm_configuracao ?? '—'}</div>
                      {r.erro && <div className="text-[10px] text-amber-500 mt-0.5">⚠ {r.erro}</div>}
                    </td>
                    <td className="p-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      [{r.cd_configuracao}]
                    </td>
                    <td className="p-2">
                      {r.qtd_tags === 0 ? (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertTriangle className="h-3 w-3" /> SEM TAG
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-600">
                          <TagIcon className="h-3 w-3" /> {r.qtd_tags}
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 6).map((t, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-mono">
                              {t.ds_tag_customizada ?? t.ds_tag_calculada ?? t.ds_tag_texto ?? '—'}
                            </Badge>
                          ))}
                          {tags.length > 6 && (
                            <span className="text-[10px] text-muted-foreground">+{tags.length - 6}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && lista.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">
                  {isActive
                    ? 'Descobrindo configurações no Auge… elas aparecerão aqui assim que forem gravadas.'
                    : 'Nenhuma configuração encontrada. Clique em "Varrer Auge" para escanear todas as configurações.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
