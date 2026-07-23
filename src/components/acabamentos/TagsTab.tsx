import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Search, Loader2, ArrowDownAZ, ArrowUpAZ, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { isMissingTag } from '@/lib/tag-utils';
import { toast } from 'sonner';

interface Acabamento {
  cd_acabamento: string;
  chave_acabamento: string | null;
  nm_acabamento: string;
  ds_tag_calculada: string | null;
  ds_descricao_tag_calculada: string | null;
  id_cancelado: string | null;
  synced_at: string | null;
}

interface SyncRun {
  id: string;
  status: string;
  error_message: string | null;
  detalhes: { phase?: string; current?: number; total?: number; itens?: number } | null;
}

export default function TagsTab() {
  const [busca, setBusca] = useState('');
  const [sortBy, setSortBy] = useState<'nome' | 'tag'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [syncing, setSyncing] = useState(false);
  const [run, setRun] = useState<SyncRun | null>(null);
  const channelRef = useRef<any>(null);

  const { data: acabamentos = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['acabamentos-tags-sem'],
    queryFn: async () => {
      // Puxa TODOS os acabamentos sincronizados do Auge (o filtro "sem TAG" é aplicado no cliente)
      const { data } = await (supabase as any)
        .from('auge_acabamentos')
        .select('cd_acabamento, chave_acabamento, nm_acabamento, ds_tag_calculada, ds_descricao_tag_calculada, id_cancelado, synced_at')
        .or('id_cancelado.is.null,id_cancelado.neq.S')
        .order('nm_acabamento', { ascending: true })
        .limit(10000);
      return ((data ?? []) as Acabamento[]).filter(isMissingTag);
    },
  });

  useEffect(() => () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  }, []);

  const subscribeRun = (runId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`tags-sync-${runId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auge_sync_runs', filter: `id=eq.${runId}` },
        (p: any) => {
          setRun(p.new as SyncRun);
          if (p.new?.status === 'success' || p.new?.status === 'error') {
            setSyncing(false);
            if (p.new?.status === 'success') {
              toast.success('Acabamentos atualizados do Auge.');
              refetch();
            } else {
              toast.error(p.new?.error_message ?? 'Falha na sincronização.');
            }
          }
        }
      )
      .subscribe();
    channelRef.current = ch;
  };

  const sincronizarDoAuge = async () => {
    setSyncing(true);
    setRun(null);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=sync_acabamentos', { body: {} });
      if (error) throw error;
      if (data?.run_id) {
        const { data: initial } = await (supabase as any)
          .from('auge_sync_runs').select('*').eq('id', data.run_id).maybeSingle();
        if (initial) setRun(initial as SyncRun);
        subscribeRun(data.run_id);
        toast.info('Sincronizando acabamentos direto do Auge…');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao iniciar sincronização.');
      setSyncing(false);
    }
  };

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    let arr = acabamentos.filter((a) => {
      if (!isMissingTag(a)) return false;
      if (t) {
        return (a.nm_acabamento ?? '').toLowerCase().includes(t) ||
               (a.chave_acabamento ?? '').toLowerCase().includes(t) ||
               (a.cd_acabamento ?? '').toLowerCase().includes(t);
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'nome') cmp = (a.nm_acabamento ?? '').localeCompare(b.nm_acabamento ?? '', 'pt-BR', { sensitivity: 'base' });
      else cmp = (a.ds_tag_calculada ?? '').localeCompare(b.ds_tag_calculada ?? '', 'pt-BR', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [acabamentos, busca, sortBy, sortDir]);

  const total = run?.detalhes?.total ?? 0;
  const current = run?.detalhes?.current ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const isActive = run?.status === 'running';

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Sem TAG (Auge)</div>
            <div className="text-lg font-semibold font-mono text-destructive">{acabamentos.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Filtrados</div>
            <div className="text-lg font-semibold font-mono">{lista.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Última sincronização</div>
            <div className="text-xs font-mono">
              {acabamentos[0]?.synced_at ? new Date(acabamentos[0].synced_at).toLocaleString('pt-BR') : '—'}
            </div>
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
              {isActive ? `Sincronizando do Auge… ${run.detalhes?.phase ?? ''}` :
                run.status === 'error' ? 'Falhou' : 'Concluído'}
            </div>
            <div className="ml-auto text-[11px] font-mono text-muted-foreground">{current}/{total}</div>
          </div>
          <Progress value={pct} className="h-2" />
        </Card>
      )}

      <Card className="p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar configuração sem TAG..." className="h-9 pl-7 text-xs" />
          </div>
          <Button size="sm" onClick={sincronizarDoAuge} disabled={syncing || isActive} className="h-9 gap-2 text-[11px]">
            {syncing || isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sincronizar do Auge
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
                <th className="p-2 cursor-pointer select-none" onClick={() => { if (sortBy === 'nome') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy('nome'); setSortDir('asc'); } }}>
                  <div className="flex items-center gap-1">
                    Configuração
                    {sortBy === 'nome' && (sortDir === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="p-2">Código</th>
                <th className="p-2">TAG</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={3} className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>
              )}
              {lista.map((a) => (
                <tr key={a.cd_acabamento} className="border-t align-top hover:bg-muted/50">
                  <td className="p-2">
                    <div className="font-medium">{a.nm_acabamento}</div>
                  </td>
                  <td className="p-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{a.chave_acabamento ?? `#${a.cd_acabamento}`}</td>
                  <td className="p-2">
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <AlertTriangle className="h-3 w-3" /> SEM TAG
                    </Badge>
                  </td>
                </tr>
              ))}
              {!isLoading && lista.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">
                  Nenhum acabamento sem TAG. Clique em "Sincronizar do Auge" para atualizar.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
