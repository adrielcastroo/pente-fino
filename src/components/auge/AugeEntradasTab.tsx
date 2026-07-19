import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Loader2, FileText, Clock, User, Archive, DollarSign, AlertTriangle, PackagePlus } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import MovimentacaoDetailDialog, { type MovimentacaoRow } from './MovimentacaoDetailDialog';

interface AugeEntrada {
  id: string;
  id_externo: string | null;
  documento: string | null;
  cd_transferencia: string | null;
  documento_tipo: string | null;
  codigo_produto: string | null;
  deposito: string | null;
  situacao: string | null;
  ds_situacao: string | null;
  quantidade: number;
  valor: number | null;
  usuario_criacao: string | null;
  data_movimento: string | null;
  observacao: string | null;
  ds_efetivacao: string | null;
  synced_at: string;
}

const SITUACAO_STYLE: Record<string, string> = {
  '10': 'bg-amber-500/10 text-warning border-amber-500/30',
  '20': 'bg-emerald-500/10 text-success border-emerald-500/30',
  '8':  'bg-red-500/10 text-destructive border-red-500/30',
  '30': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export default function AugeEntradasTab() {
  const [rows, setRows] = useState<AugeEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [situacao, setSituacao] = useState<string>('todos');
  const [pageSize, setPageSize] = useState(30);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [detail, setDetail] = useState<MovimentacaoRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auge_movimentacoes')
        .select('*')
        .eq('tipo', 'entrada')
        .order('data_movimento', { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      setRows((data as any[]) as AugeEntrada[]);
      setLastSync(data?.[0]?.synced_at ?? null);
    } catch (e: any) {
      toast.error('Erro ao carregar entradas do Auge: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando entradas do Auge...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: {},
        method: 'POST' as any,
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error || 'Falha na sincronização');
      const ent = (data?.results ?? []).find((r: any) => r.entity === 'entradas');
      if (ent?.error) throw new Error(ent.error);
      toast.success(`${ent?.upserted ?? 0} entradas sincronizadas`, { id: t });
      await load();
    } catch (e: any) {
      toast.error('Falha ao sincronizar: ' + (e.message || ''), { id: t });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPageSize(30); }, [search, situacao]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter(r => {
      if (situacao !== 'todos' && r.situacao !== situacao) return false;
      if (!q) return true;
      return (
        (r.documento || '').toLowerCase().includes(q) ||
        (r.cd_transferencia || '').toLowerCase().includes(q) ||
        (r.codigo_produto || '').toLowerCase().includes(q) ||
        (r.observacao || '').toLowerCase().includes(q) ||
        (r.usuario_criacao || '').toLowerCase().includes(q) ||
        (r.ds_situacao || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, situacao]);

  const visible = filtered.slice(0, pageSize);

  const stats = useMemo(() => {
    const total = rows.length;
    const efetivadas = rows.filter(r => r.situacao === '20').length;
    const pendentes = rows.filter(r => r.situacao === '8').length;
    const emEdicao = rows.filter(r => r.situacao === '10').length;
    const valorTotal = rows.reduce((s, r) => s + (Number(r.valor) || 0), 0);
    return { total, efetivadas, pendentes, emEdicao, valorTotal };
  }, [rows]);

  const brl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar doc, item, obs, usuário..."
            className="pl-10 h-11 rounded-md border-border/40 bg-card/40 focus:bg-background font-bold text-xs sm:text-sm"
          />
        </div>
        <Select value={situacao} onValueChange={setSituacao}>
          <SelectTrigger className="w-full lg:w-[200px] h-11 rounded-md border-border/40 font-bold text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas situações</SelectItem>
            <SelectItem value="20">Efetivadas</SelectItem>
            <SelectItem value="10">Em edição</SelectItem>
            <SelectItem value="8">Pendentes (erro)</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={sync}
          disabled={syncing}
          className="h-11 px-5 rounded-md font-semibold bg-emerald-600 hover:bg-emerald-600/90 gap-2 text-white"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar Entradas
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Total" value={stats.total} />
        <StatBox label="Efetivadas" value={stats.efetivadas} tone="emerald" />
        <StatBox label="Em edição" value={stats.emEdicao} tone="amber" />
        <StatBox label="Pendentes" value={stats.pendentes} tone="red" />
      </div>

      {lastSync && (
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Última sinc.: {formatDateBR(lastSync)} — valor total no período: {brl(stats.valorTotal)}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center">
            <PackagePlus className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">
            {rows.length === 0 ? 'Nenhuma entrada sincronizada. Clique em "Sincronizar Entradas".' : 'Nenhum resultado para o filtro.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {visible.map(r => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(r as MovimentacaoRow)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetail(r as MovimentacaoRow); } }}
              className="bg-card/60 border border-border/40 rounded-md p-4 hover:border-emerald-500/30 hover:bg-accent/30 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PackagePlus className="w-4 h-4 text-success shrink-0" />
                    <span className="font-mono font-bold text-sm text-success">
                      {r.cd_transferencia || r.documento || '—'}
                    </span>
                    {r.codigo_produto && (
                      <Badge variant="outline" className="text-[10px] font-mono border-border/40 rounded-md">
                        {r.codigo_produto}
                      </Badge>
                    )}
                    {r.documento_tipo && (
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider border-border/40 rounded-md">
                        {r.documento_tipo}
                      </Badge>
                    )}
                    <Badge
                      className={`text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                        SITUACAO_STYLE[r.situacao ?? ''] ?? 'bg-muted/20 text-muted-foreground border-border/30'
                      }`}
                    >
                      {r.ds_situacao || r.situacao || '—'}
                    </Badge>
                  </div>
                  {r.observacao && (
                    <p className="text-xs font-medium text-foreground/80 mt-2 leading-snug">
                      {r.observacao}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Info icon={Clock} label="Data" value={r.data_movimento ? formatDateBR(r.data_movimento) : '—'} />
                <Info icon={User} label="Usuário" value={r.usuario_criacao || '—'} />
                <Info icon={FileText} label="Qtd" value={String(r.quantidade || 0)} />
                <Info icon={DollarSign} label="Valor" value={r.valor ? brl(Number(r.valor)) : '—'} />
              </div>

              {r.ds_efetivacao && (
                <div className="mt-3 pt-3 border-t border-red-500/20 flex items-start gap-2 text-[11px] font-medium text-destructive/90">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="leading-snug">{r.ds_efetivacao}</span>
                </div>
              )}
            </div>
          ))}
          {filtered.length > visible.length && (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Exibindo {visible.length} de {filtered.length}
              </p>
              <Button variant="outline" onClick={() => setPageSize(p => p + 30)} className="rounded-md font-semibold text-xs h-9 px-5">
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}

      <MovimentacaoDetailDialog
        movimentacao={detail}
        tipo="entrada"
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' | 'red' }) {
  const toneCls =
    tone === 'emerald' ? 'text-success' :
    tone === 'amber' ? 'text-warning' :
    tone === 'red' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="bg-card/60 border border-border/40 rounded-md p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className={`text-xl font-bold tracking-tight ${toneCls}`}>{value}</p>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="text-xs font-bold tracking-tight truncate">{value}</p>
    </div>
  );
}
