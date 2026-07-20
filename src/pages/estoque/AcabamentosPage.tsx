import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, RefreshCw, Search, Pencil, Loader2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AcabamentoItemEditDialog from '@/components/acabamentos/AcabamentoItemEditDialog';

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
  const channelRef = useRef<any>(null);

  // Recupera última execução de acabamentos ao montar
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

  const { data: acabamentos = [], isLoading } = useQuery({
    queryKey: ['acabamentos-list'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_acabamentos')
        .select('cd_acabamento, nm_acabamento, nm_classe1, nm_combinacao1, id_cancelado, tem_item_associado, synced_at')
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
    if (!t) return acabamentos;
    return acabamentos.filter((a: any) =>
      (a.nm_acabamento ?? '').toLowerCase().includes(t) ||
      (a.cd_acabamento ?? '').toLowerCase().includes(t) ||
      (a.nm_classe1 ?? '').toLowerCase().includes(t) ||
      (a.nm_combinacao1 ?? '').toLowerCase().includes(t),
    );
  }, [acabamentos, busca]);

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
      toast.success(cdAcabamento ? 'Acabamento sincronizado.' : `Sincronizados ${data?.count ?? '—'} acabamentos.`);
      qc.invalidateQueries({ queryKey: ['acabamentos-list'] });
      if (acabSel) refetchItens();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Acabamentos"
        actions={
          <Button size="sm" onClick={() => runSync()} disabled={syncing} className="gap-2">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar todos
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <Card className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar acabamento..." className="h-9 pl-7 text-xs" />
          </div>
          <div className="text-[10px] text-muted-foreground">{filtrados.length} de {acabamentos.length}</div>
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
                    <div className="font-mono text-[10px] text-muted-foreground">#{a.cd_acabamento}</div>
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
                  <div className="font-mono text-[10px] text-muted-foreground">#{acabSel} · {itens.length} itens</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => runSync(acabSel)} disabled={syncing} className="gap-2 h-8">
                  {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Sincronizar
                </Button>
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
                            <div>{i.ds_item_acabamento ?? '—'}</div>
                            {i.ds_item_acabamento_reduzida && (
                              <div className="text-[10px] text-muted-foreground">↳ {i.ds_item_acabamento_reduzida}</div>
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

      <AcabamentoItemEditDialog
        item={editing}
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSaved={() => refetchItens()}
      />
    </div>
  );
}
