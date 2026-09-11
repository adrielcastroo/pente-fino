import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, RefreshCw, Search, Pencil, Loader2, AlertTriangle, CheckCircle2, X, ArrowDownAZ, ArrowUpAZ, ArrowUp01, ArrowDown01, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AcabamentoItemEditDialog from '@/components/acabamentos/AcabamentoItemEditDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncluirItemMassaTab from '@/components/acabamentos/IncluirItemMassaTab';
import TagsTab from '@/components/acabamentos/TagsTab';
import GerarTagTab from '@/components/acabamentos/GerarTagTab';
import HistoricoTagsTab from '@/components/acabamentos/HistoricoTagsTab';

interface SyncRun {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  rows_processed: number | null;
  rows_upserted: number | null;
  error_message: string | null;
  detalhes: {
    phase?: string;
    current?: number;
    total?: number;
    itens?: number;
    errors?: Array<{ cd: string; nm?: string; erro: string }>;
  } | null;
}

export default function AcabamentosPage() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [acabSel, setAcabSel] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [run, setRun] = useState<SyncRun | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [sortBy, setSortBy] = useState<'nome' | 'codigo'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [tab, setTab] = useState<string>('consulta');
  const channelRef = useRef<any>(null);

  // Estados para aba "Atualizar descrição"
  const [itemBusca, setItemBusca] = useState(() => {
    const saved = localStorage.getItem('acabamentos:atualizar_desc:busca');
    return saved || '';
  });
  const [itemBuscaResult, setItemBuscaResult] = useState<any[]>([]);
  const [itemBuscaLoading, setItemBuscaLoading] = useState(false);
  const [selectedAcabamentos, setSelectedAcabamentos] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('acabamentos:atualizar_desc:selecionados');
    if (saved) return new Set(JSON.parse(saved));
    return new Set();
  });
  const [novaDescricao, setNovaDescricao] = useState(() => {
    const saved = localStorage.getItem('acabamentos:atualizar_desc:descricao');
    return saved || '';
  });
  const [atualizando, setAtualizando] = useState(false);

  // Persistência da aba "Atualizar descrição"
  useEffect(() => {
    try {
      localStorage.setItem('acabamentos:atualizar_desc:busca', itemBusca);
    } catch (e) { /* ignore */ }
  }, [itemBusca]);

  useEffect(() => {
    try {
      localStorage.setItem('acabamentos:atualizar_desc:selecionados', JSON.stringify(Array.from(selectedAcabamentos)));
    } catch (e) { /* ignore */ }
  }, [selectedAcabamentos]);

  useEffect(() => {
    try {
      localStorage.setItem('acabamentos:atualizar_desc:descricao', novaDescricao);
    } catch (e) { /* ignore */ }
  }, [novaDescricao]);

  // 1. Carregamento de aba inicial (uma única vez)
  useEffect(() => {
    const saved = localStorage.getItem('acabamentos:tab');
    if (saved) setTab(saved);
  }, []);

  // 2. Persistência de aba
  useEffect(() => {
    try {
      localStorage.setItem('acabamentos:tab', tab);
    } catch (e) {
      console.warn('Erro ao salvar aba no localStorage', e);
    }
  }, [tab]);

  // 3. Recupera última execução de acabamentos ao montar
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('auge_sync_runs')
        .select('*')
        .eq('entidade', 'acabamentos')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setRun(data as SyncRun);
    })();
  }, []);

  // Assina realtime para o run em andamento
  const subscribeRun = (runId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const ch = supabase
      .channel(`acab-run-${runId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auge_sync_runs', filter: `id=eq.${runId}` },
        (payload: any) => {
          setRun(payload.new as SyncRun);
          if (payload.new?.status === 'success' || payload.new?.status === 'error') {
            setSyncing(false);
            qc.invalidateQueries({ queryKey: ['acabamentos-list'] });
            if (acabSel) refetchItens();
            const errs = (payload.new?.detalhes?.errors ?? []) as any[];
            if (payload.new?.status === 'success') {
              toast.success(
                `Sincronização concluída: ${payload.new?.rows_processed ?? 0} acabamentos, ${payload.new?.rows_upserted ?? 0} itens${errs.length ? ` (${errs.length} com erro)` : ''}.`,
              );
            } else {
              toast.error(payload.new?.error_message ?? 'Sincronização falhou.');
            }
          }
        },
      )
      .subscribe();
    channelRef.current = ch;
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // Realtime: escuta mudanças em auge_acabamento_itens para o acabamento selecionado
  useEffect(() => {
    if (!acabSel) return;
    const ch = supabase
      .channel(`acab-itens-${acabSel}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auge_acabamento_itens', filter: `cd_acabamento=eq.${acabSel}` },
        () => {
          qc.invalidateQueries({ queryKey: ['acabamento-itens', acabSel] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [acabSel, qc]);

  const { data: acabamentos = [], isLoading } = useQuery({
    queryKey: ['acabamentos-list'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_acabamentos')
        .select('cd_acabamento, chave_acabamento, nm_acabamento, nm_classe1, nm_combinacao1, id_cancelado, tem_item_associado, synced_at')
        .order('nm_acabamento', { ascending: true })
        .limit(2000);
      return (data ?? []) as any[];
    },
  });

  const { data: itens = [], refetch: refetchItens } = useQuery({
    queryKey: ['acabamento-itens', acabSel],
    enabled: !!acabSel,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_acabamento_itens')
        .select('*')
        .eq('cd_acabamento', acabSel!)
        .limit(500);
      return (data ?? []) as any[];
    },
  });

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const base = !t ? acabamentos : acabamentos.filter((a: any) =>
      (a.nm_acabamento ?? '').toLowerCase().includes(t) ||
      (a.chave_acabamento ?? '').toLowerCase().includes(t) ||
      (a.cd_acabamento ?? '').toLowerCase().includes(t) ||
      (a.nm_classe1 ?? '').toLowerCase().includes(t) ||
      (a.nm_combinacao1 ?? '').toLowerCase().includes(t),
    );
    const arr = [...base];
    arr.sort((a: any, b: any) => {
      let cmp = 0;
      if (sortBy === 'nome') {
        cmp = (a.nm_acabamento ?? '').localeCompare(b.nm_acabamento ?? '', 'pt-BR', { sensitivity: 'base' });
      } else {
        const ak = a.chave_acabamento ?? a.cd_acabamento ?? '';
        const bk = b.chave_acabamento ?? b.cd_acabamento ?? '';
        const an = Number(ak), bn = Number(bk);
        cmp = Number.isFinite(an) && Number.isFinite(bn) ? an - bn : String(ak).localeCompare(String(bk), 'pt-BR');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [acabamentos, busca, sortBy, sortDir]);


  const acabSelObj = acabamentos.find((a: any) => a.cd_acabamento === acabSel);

  const runSync = async (cdAcabamento?: string) => {
    setSyncing(true);
    try {
      const action = cdAcabamento ? 'sync_acabamento_one' : 'sync_acabamentos';
      const { data, error } = await supabase.functions.invoke(`auge-sync?action=${action}`, {
        body: cdAcabamento ? { cdAcabamento } : {},
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data?.error ?? 'Falha ao sincronizar');

      if (cdAcabamento) {
        toast.success('Acabamento sincronizado.');
        qc.invalidateQueries({ queryKey: ['acabamentos-list'] });
        if (acabSel) refetchItens();
        setSyncing(false);
      } else if (data?.run_id) {
        // Sincronização em background: escuta progresso via realtime
        setShowPanel(true);
        // busca estado inicial
        const { data: initial } = await (supabase as any)
          .from('auge_sync_runs').select('*').eq('id', data.run_id).maybeSingle();
        if (initial) setRun(initial as SyncRun);
        subscribeRun(data.run_id);
        toast.info('Sincronização iniciada. Acompanhe o progresso abaixo.');
      } else {
        setSyncing(false);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro na sincronização');
      setSyncing(false);
    }
  };

  const progressPct = run?.detalhes?.total
    ? Math.min(100, Math.round(((run.detalhes.current ?? 0) / run.detalhes.total) * 100))
    : run?.status === 'running' ? 5 : 0;
  const runErrors = run?.detalhes?.errors ?? [];
  const runIsActive = run?.status === 'running';

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Acabamentos"
        actions={
          <div className="flex items-center gap-2">
            {run && !showPanel && (
              <Button size="sm" variant="outline" onClick={() => setShowPanel(true)} className="gap-2 h-9">
                {runIsActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                  run.status === 'error' ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> :
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                Ver progresso
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="consulta" className="text-xs">Consulta</TabsTrigger>
          <TabsTrigger value="massa" className="text-xs">Incluir em massa</TabsTrigger>
          <TabsTrigger value="atualizar_desc" className="text-xs">Atualizar descrição</TabsTrigger>
          <TabsTrigger value="tags" className="text-xs">TAGs</TabsTrigger>
          <TabsTrigger value="gerar" className="text-xs">Gerar TAG</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="consulta" className="space-y-4 mt-0">

      {showPanel && run && (
        <Card className="p-3 md:p-4 border-primary/40 bg-primary/5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {runIsActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              ) : run.status === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  {runIsActive ? 'Sincronizando acabamentos…' :
                    run.status === 'error' ? 'Sincronização finalizada com erro' :
                    'Sincronização concluída'}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Iniciada {formatDistanceToNow(new Date(run.started_at), { addSuffix: true, locale: ptBR })}
                  {run.finished_at && ` · Concluída ${formatDistanceToNow(new Date(run.finished_at), { addSuffix: true, locale: ptBR })}`}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowPanel(false)} aria-label="Fechar painel">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Progress value={progressPct} className="h-2" />
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <div><span className="text-muted-foreground">Progresso:</span> <span className="font-mono">{run.detalhes?.current ?? 0}/{run.detalhes?.total ?? 0}</span></div>
            <div><span className="text-muted-foreground">Itens gravados:</span> <span className="font-mono">{run.detalhes?.itens ?? run.rows_upserted ?? 0}</span></div>
            <div><span className="text-muted-foreground">Erros:</span> <span className="font-mono">{runErrors.length}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant={run.status === 'error' ? 'destructive' : run.status === 'success' ? 'default' : 'secondary'} className="text-[10px]">{run.status}</Badge></div>
          </div>

          {run.error_message && (
            <div className="mt-2 text-[11px] text-destructive break-words">{run.error_message}</div>
          )}

          {runErrors.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Acabamentos com erro ({runErrors.length})
              </div>
              <ScrollArea className="max-h-48 rounded border bg-background">
                <div className="divide-y">
                  {runErrors.map((e, i) => (
                    <div key={i} className="p-2 text-[11px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-muted-foreground">#{e.cd}</span>
                        {e.nm && <span className="font-medium truncate">{e.nm}</span>}
                        <Button size="sm" variant="ghost" className="h-6 px-2 ml-auto text-[10px] gap-1" onClick={() => runSync(e.cd)}>
                          <RefreshCw className="h-3 w-3" /> Retentar
                        </Button>
                      </div>
                      <div className="text-destructive/90 break-words mt-0.5">{e.erro}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <Card className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar acabamento..." className="h-9 pl-7 text-xs" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] text-muted-foreground">{filtrados.length} de {acabamentos.length}</div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={sortBy === 'nome' ? 'default' : 'outline'}
                onClick={() => {
                  if (sortBy === 'nome') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('nome'); setSortDir('asc'); }
                }}
                className="h-7 px-2 gap-1 text-[10px]"
                title="Ordenar por descrição"
              >
                {sortBy === 'nome' && sortDir === 'desc' ? <ArrowUpAZ className="h-3 w-3" /> : <ArrowDownAZ className="h-3 w-3" />}
                Descrição
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'codigo' ? 'default' : 'outline'}
                onClick={() => {
                  if (sortBy === 'codigo') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('codigo'); setSortDir('asc'); }
                }}
                className="h-7 px-2 gap-1 text-[10px]"
                title="Ordenar por código"
              >
                {sortBy === 'codigo' && sortDir === 'desc' ? <ArrowUp01 className="h-3 w-3" /> : <ArrowDown01 className="h-3 w-3" />}
                Código
              </Button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-auto space-y-1">
            {isLoading && <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>}
            {filtrados.map((a: any) => (
              <button
                key={a.cd_acabamento}
                onClick={() => setAcabSel(a.cd_acabamento)}
                className={`w-full text-left rounded border p-2 text-xs transition ${acabSel === a.cd_acabamento ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{a.nm_acabamento ?? '—'}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{a.chave_acabamento ?? `#${a.cd_acabamento}`}</div>
                    {(a.nm_classe1 || a.nm_combinacao1) && (
                      <div className="text-[10px] text-muted-foreground truncate">{a.nm_classe1} {a.nm_combinacao1 && `· ${a.nm_combinacao1}`}</div>
                    )}
                  </div>
                  {a.id_cancelado === 'S' && <Badge variant="destructive" className="text-[9px]">canc.</Badge>}
                </div>
              </button>
            ))}
            {!isLoading && filtrados.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">Nenhum acabamento. Rode a sincronização.</div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          {!acabSel ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Selecione um acabamento à esquerda para ver seus itens.</div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{acabSelObj?.nm_acabamento}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{acabSelObj?.chave_acabamento ?? `#${acabSel}`} · {itens.length} itens</div>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0"><tr className="text-left">
                    <th className="p-2">Código</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2">Kits complementares</th>
                    <th className="p-2 text-right w-24">Ações</th>
                  </tr></thead>
                  <tbody>
                    {itens.map((i: any) => {
                      const kits = [1, 2, 3, 4, 5].map((n) => i[`nm_kit_complementar_${n}`]).filter(Boolean);
                      return (
                        <tr key={i.cd_acabamento_item} className="border-t align-top">
                          <td className="p-2 font-mono text-[11px]">{i.cd_item_acabamento}</td>
                          <td className="p-2">
                            <div>{i.ds_item_acabamento_original ?? i.ds_item_acabamento ?? '—'}</div>
                            {i.ds_item_acabamento && i.ds_item_acabamento_original && i.ds_item_acabamento !== i.ds_item_acabamento_original && (
                              <div className="text-[10px] text-muted-foreground">↳ {i.ds_item_acabamento}</div>
                            )}
                          </td>
                          <td className="p-2 text-[11px] text-muted-foreground">{kits.length ? kits.join(', ') : '—'}</td>
                          <td className="p-2 text-right">
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => setEditing({ ...i, nm_acabamento: acabSelObj?.nm_acabamento })}>
                              <Pencil className="h-3 w-3" /> Editar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {itens.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem itens sincronizados. Clique em Sincronizar.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {acabSelObj?.synced_at && (
                <div className="p-2 border-t text-[10px] text-muted-foreground text-right">
                  Última sync {formatDistanceToNow(new Date(acabSelObj.synced_at), { addSuffix: true, locale: ptBR })}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="massa" className="mt-0"><IncluirItemMassaTab /></TabsContent>
        <TabsContent value="atualizar_desc" className="mt-0">
          <AtualizarDescricaoTab
            acabamentos={acabamentos}
            itemBusca={itemBusca}
            itemBuscaResult={itemBuscaResult}
            itemBuscaLoading={itemBuscaLoading}
            selectedAcabamentos={selectedAcabamentos}
            novaDescricao={novaDescricao}
            onItemBuscaChange={setItemBusca}
            onSearchItem={async (term) => {
              setItemBuscaLoading(true);
              try {
                const { data } = await supabase
                  .from('auge_acabamento_itens')
                  .select('cd_acabamento_item, cd_acabamento, cd_item_acabamento, ds_item_acabamento, ds_item_acabamento_original')
                  .ilike('cd_item_acabamento', `%${term}%`)
                  .limit(2000);
                setItemBuscaResult(data || []);
              } catch {
                toast.error('Erro ao buscar item');
              } finally {
                setItemBuscaLoading(false);
              }
            }}
            onSelectAll={() => setSelectedAcabamentos(new Set(itemBuscaResult.map((r: any) => r.cd_acabamento)))}
            onDeselectAll={() => setSelectedAcabamentos(new Set())}
            onToggleAcabamento={(cd) => {
              setSelectedAcabamentos(prev => {
                const next = new Set(prev);
                if (next.has(cd)) next.delete(cd);
                else next.add(cd);
                return next;
              });
            }}
            onNovaDescricaoChange={setNovaDescricao}
            onAtualizar={async () => {
              if (!novaDescricao.trim()) {
                toast.error('Digite uma descrição');
                return;
              }
              if (selectedAcabamentos.size === 0) {
                toast.error('Selecione pelo menos um acabamento');
                return;
              }
              setAtualizando(true);
              try {
                const updates: any[] = [];
                for (const cdAcabamento of selectedAcabamentos) {
                  const itens = itemBuscaResult.filter((r: any) => r.cd_acabamento === cdAcabamento);
                  for (const item of itens) {
                    updates.push({
                      cdAcabamentoItem: item.cd_acabamento_item,
                      cdAcabamento,
                      cdItemAcabamento: item.cd_item_acabamento,
                      dsItemAcabamento: novaDescricao,
                      dsItemAcabamentoReduzida: '',
                      dsItemAcabamentoOriginal: item.ds_item_acabamento_original || '',
                      cdKitComplementar1: '',
                      cdKitComplementar2: '',
                      cdKitComplementar3: '',
                      cdKitComplementar4: '',
                      cdKitComplementar5: '',
                    });
                  }
                }
                for (const update of updates) {
                  await supabase.functions.invoke('auge-sync?action=update_acabamento_item', { body: update });
                }
                toast.success(`Descrição atualizada para ${selectedAcabamentos.size} acabamento(s)`);
                setSelectedAcabamentos(new Set());
                setNovaDescricao('');
                qc.invalidateQueries({ queryKey: ['acabamentos-list'] });
              } catch (e: any) {
                toast.error(e?.message || 'Erro ao atualizar descrição');
              } finally {
                setAtualizando(false);
              }
            }}
            atualizando={atualizando}
          />
        </TabsContent>
        <TabsContent value="tags" className="mt-0"><TagsTab /></TabsContent>
        <TabsContent value="gerar" className="mt-0">
          <GerarTagTab onVerHistorico={() => setTab('historico')} />
        </TabsContent>
        <TabsContent value="historico" className="mt-0"><HistoricoTagsTab /></TabsContent>
      </Tabs>



      {/* debug */}
      <AcabamentoItemEditDialog
        item={editing}
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSaved={() => refetchItens()}
      />
    </div>
  );
}

function AtualizarDescricaoTab({
  acabamentos,
  itemBusca,
  itemBuscaResult,
  itemBuscaLoading,
  selectedAcabamentos,
  novaDescricao,
  onItemBuscaChange,
  onSearchItem,
  onSelectAll,
  onDeselectAll,
  onToggleAcabamento,
  onNovaDescricaoChange,
  onAtualizar,
  atualizando
}: any) {
  const acabByCd = useMemo(() => {
    const m = new Map<string, any>();
    acabamentos.forEach((a: any) => m.set(a.cd_acabamento, a));
    return m;
  }, [acabamentos]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Buscar Item
          </CardTitle>
          <CardDescription>
            Digite o código do item para buscar em todos os acabamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={itemBusca}
              onChange={(e) => onItemBuscaChange(e.target.value)}
              placeholder="Digite o código do item..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && itemBusca.trim()) {
                  onSearchItem(itemBusca.trim());
                }
              }}
            />
            <Button onClick={() => onSearchItem(itemBusca.trim())} disabled={itemBuscaLoading || !itemBusca.trim()}>
              {itemBuscaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {itemBuscaResult.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Resultados ({itemBuscaResult.length})
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onSelectAll}>
                  Selecionar Todos
                </Button>
                <Button size="sm" variant="outline" onClick={onDeselectAll}>
                  Desmarcar Todos
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Selecione quais acabamentos deseja atualizar a descrição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(
                itemBuscaResult.reduce((acc: any, item: any) => {
                  if (!acc[item.cd_acabamento]) {
                    acc[item.cd_acabamento] = {
                      acab: acabByCd.get(item.cd_acabamento),
                      itens: []
                    };
                  }
                  acc[item.cd_acabamento].itens.push(item);
                  return acc;
                }, {})
              ).map(([cdAcabamento, data]: any) => {
                const primeiraDescricao = data.itens[0]?.ds_item_acabamento || data.itens[0]?.ds_item_acabamento_original || '—';
                return (
                  <div key={cdAcabamento} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedAcabamentos.has(cdAcabamento)}
                        onChange={() => onToggleAcabamento(cdAcabamento)}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{data.acab?.nm_acabamento || cdAcabamento}</span>
                          <Badge variant="secondary" className="text-xs">{data.itens.length} itens</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {data.itens.map((item: any) => item.cd_item_acabamento).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="ml-8 bg-muted/50 rounded p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Descrição atual</div>
                      <div className="text-sm font-medium">{primeiraDescricao}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAcabamentos.size > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Nova Descrição
            </CardTitle>
            <CardDescription>
              {selectedAcabamentos.size} acabamento(s) selecionado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Descrição</label>
              <Textarea
                value={novaDescricao}
                onChange={(e) => onNovaDescricaoChange(e.target.value)}
                placeholder="Digite a nova descrição para todos os itens selecionados..."
                rows={4}
                className="resize-none text-base"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedAcabamentos(new Set())} disabled={atualizando}>
                Cancelar
              </Button>
              <Button onClick={onAtualizar} disabled={atualizando || !novaDescricao.trim()}>
                {atualizando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Atualizar no Auge ({selectedAcabamentos.size})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
