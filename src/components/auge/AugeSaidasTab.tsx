import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Clock, User, Archive, DollarSign, AlertTriangle } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import FiltroColapsado from '@/components/erp/FiltroColapsado';
import Paginacao from '@/components/erp/Paginacao';
import MovimentacaoDetailDialog, { type MovimentacaoRow } from './MovimentacaoDetailDialog';


interface AugeSaida {
  id: string;
  id_externo: string | null;
  documento: string | null;
  cd_transferencia: string | null;
  documento_tipo: string | null;
  situacao: string | null;
  ds_situacao: string | null;
  quantidade: number;
  valor: number | null;
  usuario_criacao: string | null;
  usuario_efetivacao: string | null;
  data_movimento: string | null;
  dt_efetivacao: string | null;
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

export default function AugeSaidasTab() {
  const [rows, setRows] = useState<AugeSaida[]>([]);
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
        .eq('tipo', 'saida')
        .order('data_movimento', { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      setRows((data as any[]) as AugeSaida[]);
      setLastSync(data?.[0]?.synced_at ?? null);
    } catch (e: any) {
      toast.error('Erro ao carregar saídas do Auge: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando saídas do Auge...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: {},
        method: 'POST' as any,
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error || 'Falha na sincronização');
      const mov = (data?.results ?? []).find((r: any) => r.entity === 'movimentacoes');
      toast.success(`${mov?.upserted ?? 0} saídas sincronizadas`, { id: t });
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
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar transferência, obs, usuário..."
            className="pl-10 h-11 rounded-md border-border/40 bg-card/40 focus:bg-background font-bold text-xs sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiltroColapsado
            label="Situação"
            value={situacao}
            onChange={setSituacao}
            opcoes={[
              { value: '20', label: 'Efetivadas', count: stats.efetivadas },
              { value: '10', label: 'Em edição', count: stats.emEdicao },
              { value: '8', label: 'Pendentes (erro)', count: stats.pendentes },
            ]}
          />
          <FiltroColapsado
            label="Usuário"
            value={usuario}
            onChange={setUsuario}
            opcoes={usuarios.map(u => ({
              value: u,
              label: u,
              count: rows.filter(r => r.usuario_criacao === u).length,
            }))}
          />
        </div>

      </div>

      {/* Stats */}
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

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center">
            <Archive className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">
            {rows.length === 0 ? 'Nenhum registro sincronizado. Clique em "Sincronizar Auge".' : 'Nenhum resultado para o filtro.'}
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
              className="bg-card/60 border border-border/40 rounded-md p-4 hover:border-primary/40 hover:bg-accent/30 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-primary">
                      {r.cd_transferencia || r.documento || '—'}
                    </span>
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
                <Info icon={Clock} label="Criado em" value={r.data_movimento ? formatDateBR(r.data_movimento) : '—'} />
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
          <Paginacao
            total={filtered.length}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

        </div>
      )}

      <MovimentacaoDetailDialog
        movimentacao={detail}
        tipo="saida"
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
