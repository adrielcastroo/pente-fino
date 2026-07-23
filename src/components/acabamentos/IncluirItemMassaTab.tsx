import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, Send, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

interface Acabamento {
  cd_acabamento: string;
  chave_acabamento: string | null;
  nm_acabamento: string;
  id_cancelado: string | null;
}

interface RunDetalhes {
  phase?: string;
  current?: number;
  total?: number;
  item?: string;
  results?: Array<{ cd: string; ok: boolean; erro?: string }>;
}

interface SyncRun {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  detalhes: RunDetalhes | null;
}

const emptyItem = {
  cdItemAcabamento: '',
  dsItemAcabamento: '',
  dsItemAcabamentoReduzida: '',
  dsItemAcabamentoOriginal: '',
  cdKitComplementar1: '',
  cdKitComplementar2: '',
  cdKitComplementar3: '',
  cdKitComplementar4: '',
  cdKitComplementar5: '',
};

export default function IncluirItemMassaTab() {
  const [item, setItem] = useState({ ...emptyItem });
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [run, setRun] = useState<SyncRun | null>(null);
  const channelRef = useRef<any>(null);

  const { data: acabamentos = [], isLoading } = useQuery({
    queryKey: ['acabamentos-list-massa'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_acabamentos')
        .select('cd_acabamento, chave_acabamento, nm_acabamento, id_cancelado')
        .neq('id_cancelado', 'S')
        .order('nm_acabamento', { ascending: true })
        .limit(3000);
      return (data ?? []) as Acabamento[];
    },
  });

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return acabamentos;
    return acabamentos.filter((a) =>
      (a.nm_acabamento ?? '').toLowerCase().includes(t) ||
      (a.chave_acabamento ?? '').toLowerCase().includes(t) ||
      (a.cd_acabamento ?? '').toLowerCase().includes(t)
    );
  }, [acabamentos, busca]);

  useEffect(() => () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  }, []);

  const subscribeRun = (runId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`incluir-massa-${runId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auge_sync_runs', filter: `id=eq.${runId}` },
        (p: any) => {
          setRun(p.new as SyncRun);
          if (p.new?.status === 'success' || p.new?.status === 'error') {
            setEnviando(false);
            const dets = p.new?.detalhes as RunDetalhes | null;
            const ok = dets?.results?.filter((r) => r.ok).length ?? 0;
            const fail = (dets?.results?.length ?? 0) - ok;
            if (p.new?.status === 'success') toast.success(`Incluído em ${ok} acabamentos${fail ? ` (${fail} falharam)` : ''}.`);
            else toast.error(p.new?.error_message ?? `Falhou: ${fail} erro(s).`);
          }
        }
      )
      .subscribe();
    channelRef.current = ch;
  };

  const toggle = (cd: string) => {
    setSelecionados((prev) => {
      const n = new Set(prev);
      if (n.has(cd)) n.delete(cd); else n.add(cd);
      return n;
    });
  };
  const toggleAllFiltrados = () => {
    const allSelected = filtrados.every((a) => selecionados.has(a.cd_acabamento));
    setSelecionados((prev) => {
      const n = new Set(prev);
      if (allSelected) filtrados.forEach((a) => n.delete(a.cd_acabamento));
      else filtrados.forEach((a) => n.add(a.cd_acabamento));
      return n;
    });
  };

  const enviar = async () => {
    if (!item.cdItemAcabamento.trim()) return toast.error('Informe o Código do Tecido/Kit.');
    if (selecionados.size === 0) return toast.error('Selecione ao menos 1 acabamento.');

    setEnviando(true);
    setRun(null);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=incluir_item_massa', {
        body: { item, cdAcabamentos: Array.from(selecionados) },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data?.error ?? 'Falha ao iniciar');
      if (data?.run_id) {
        const { data: initial } = await (supabase as any)
          .from('auge_sync_runs').select('*').eq('id', data.run_id).maybeSingle();
        if (initial) setRun(initial as SyncRun);
        subscribeRun(data.run_id);
        toast.info(`Iniciando inclusão em ${selecionados.size} acabamentos…`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro');
      setEnviando(false);
    }
  };

  const results = run?.detalhes?.results ?? [];
  const total = run?.detalhes?.total ?? selecionados.size;
  const current = run?.detalhes?.current ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const okCount = results.filter((r) => r.ok).length;
  const errCount = results.filter((r) => !r.ok).length;
  const isActive = run?.status === 'running';

  const acabByCd = useMemo(() => {
    const m = new Map<string, Acabamento>();
    acabamentos.forEach((a) => m.set(a.cd_acabamento, a));
    return m;
  }, [acabamentos]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
      {/* Formulário do item */}
      <Card className="p-4 space-y-3 h-fit">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados do item</div>
        <div className="space-y-2">
          <label className="text-[11px] font-medium">Código do Tecido/Kit *</label>
          <Input value={item.cdItemAcabamento} onChange={(e) => setItem({ ...item, cdItemAcabamento: e.target.value.toUpperCase() })} className="h-9 text-xs font-mono" placeholder="Ex: TEC001234" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-medium">Descrição do Tecido/Kit</label>
          <Input value={item.dsItemAcabamento} onChange={(e) => setItem({ ...item, dsItemAcabamento: e.target.value })} className="h-9 text-xs" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-medium">Descrição Reduzida</label>
          <Input value={item.dsItemAcabamentoReduzida} onChange={(e) => setItem({ ...item, dsItemAcabamentoReduzida: e.target.value })} className="h-9 text-xs" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-medium">Descrição Original</label>
          <Textarea value={item.dsItemAcabamentoOriginal} onChange={(e) => setItem({ ...item, dsItemAcabamentoOriginal: e.target.value })} className="text-xs min-h-[60px]" />
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="space-y-1">
              <label className="text-[11px] font-medium">Kit Complementar {String(n).padStart(2, '0')}</label>
              <Input
                value={(item as any)[`cdKitComplementar${n}`]}
                onChange={(e) => setItem({ ...item, [`cdKitComplementar${n}`]: e.target.value })}
                className="h-8 text-xs font-mono"
                placeholder="Código"
              />
            </div>
          ))}
        </div>
        <Button onClick={enviar} disabled={enviando || isActive} className="w-full h-10 gap-2">
          {enviando || isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Incluir em {selecionados.size} acabamento(s)
        </Button>
      </Card>

      {/* Seleção + Progresso */}
      <div className="space-y-3">
        {run && (
          <Card className="p-3 border-primary/40 bg-primary/5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {isActive ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> :
                  run.status === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive" /> :
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                <div className="text-xs font-semibold">
                  {isActive ? `Incluindo item ${run.detalhes?.item ?? ''}…` :
                    run.status === 'error' ? 'Concluído com erros' : 'Concluído'}
                </div>
              </div>
              {!isActive && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRun(null)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Progress value={pct} className="h-2" />
            <div className="mt-2 grid grid-cols-4 gap-2 text-[11px]">
              <div><span className="text-muted-foreground">Progresso:</span> <span className="font-mono">{current}/{total}</span></div>
              <div><span className="text-muted-foreground">Sucesso:</span> <span className="font-mono text-emerald-600">{okCount}</span></div>
              <div><span className="text-muted-foreground">Erros:</span> <span className="font-mono text-destructive">{errCount}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant={run.status === 'error' ? 'destructive' : run.status === 'success' ? 'default' : 'secondary'} className="text-[10px]">{run.status}</Badge></div>
            </div>
            {results.length > 0 && (
              <ScrollArea className="mt-3 max-h-56 rounded border bg-background">
                <div className="divide-y">
                  {results.slice().reverse().map((r, i) => {
                    const a = acabByCd.get(r.cd);
                    return (
                      <div key={i} className="p-2 text-[11px] flex items-start gap-2">
                        {r.ok
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          : <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{a?.nm_acabamento ?? `#${r.cd}`}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{a?.chave_acabamento ?? r.cd}</div>
                          {!r.ok && <div className="text-destructive/90 break-words">{r.erro}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </Card>
        )}

        <Card className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar acabamentos para incluir..." className="h-9 pl-7 text-xs" />
            </div>
            <Button size="sm" variant="outline" onClick={toggleAllFiltrados} className="h-9 text-[11px]">
              {filtrados.every((a) => selecionados.has(a.cd_acabamento)) ? 'Desmarcar' : 'Marcar'} filtrados
            </Button>
            {selecionados.size > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setSelecionados(new Set())} className="h-9 text-[11px]">
                Limpar ({selecionados.size})
              </Button>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">{filtrados.length} de {acabamentos.length} · {selecionados.size} selecionados</div>
          <div className="max-h-[60vh] overflow-auto space-y-1">
            {isLoading && <div className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>}
            {filtrados.map((a) => {
              const sel = selecionados.has(a.cd_acabamento);
              return (
                <button
                  key={a.cd_acabamento}
                  onClick={() => toggle(a.cd_acabamento)}
                  className={`w-full text-left rounded border p-2 text-xs transition ${sel ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${sel ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                      {sel && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{a.nm_acabamento}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{a.chave_acabamento ?? `#${a.cd_acabamento}`}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
