import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, RefreshCw, Loader2, Package, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';

interface AugeProduto {
  id: string;
  codigo: string;
  descricao: string | null;
  categoria: string | null;
  ncm: string | null;
  unidade: string | null;
  ativo: boolean | null;
  id_estoque: boolean | null;
  id_venda: boolean | null;
  id_compra: boolean | null;
  qt_estoque: number | null;
  qt_disponivel: number | null;
  qt_entrada_prevista: number | null;
  qt_saida_prevista: number | null;
  synced_at: string;
}

const PAGE_SIZE = 50;

export default function AugeProdutosTab() {
  const [rows, setRows] = useState<AugeProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState<string>('todos');
  const [ativoFilter, setAtivoFilter] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Pagina para trazer todos (>3.6k itens)
      const pageSize = 1000;
      const all: AugeProduto[] = [];
      for (let from = 0; from < 20000; from += pageSize) {
        const { data, error } = await supabase
          .from('auge_produtos')
          .select('*')
          .order('codigo', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const batch = (data || []) as AugeProduto[];
        all.push(...batch);
        if (batch.length < pageSize) break;
      }
      setRows(all);
      setLastSync(all[0]?.synced_at ?? null);
    } catch (e: any) {
      toast.error('Erro ao carregar produtos do Auge: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando itens do Auge...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: {},
        method: 'POST' as any,
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error || 'Falha na sincronização');
      const prod = (data?.results ?? []).find((r: any) => r.entity === 'produtos');
      toast.success(`${prod?.upserted ?? 0} itens sincronizados do Auge`, { id: t });
      await load();
    } catch (e: any) {
      toast.error('Falha ao sincronizar: ' + (e.message || ''), { id: t });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, categoria, ativoFilter]);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => { if (r.categoria) s.add(r.categoria); });
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter(r => {
      if (categoria !== 'todos' && r.categoria !== categoria) return false;
      if (ativoFilter === 'ativos' && !r.ativo) return false;
      if (ativoFilter === 'inativos' && r.ativo) return false;
      if (!q) return true;
      return (
        (r.codigo || '').toLowerCase().includes(q) ||
        (r.descricao || '').toLowerCase().includes(q) ||
        (r.ncm || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, categoria, ativoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const stats = useMemo(() => {
    const total = rows.length;
    const ativos = rows.filter(r => r.ativo).length;
    const comEstoque = rows.filter(r => (r.qt_disponivel || 0) > 0).length;
    const semEstoque = rows.filter(r => (r.qt_disponivel || 0) <= 0).length;
    return { total, ativos, comEstoque, semEstoque };
  }, [rows]);

  const fmtNum = (v: number | null | undefined) =>
    v == null ? '—' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código, descrição ou NCM..."
            className="pl-10 h-11"
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full lg:w-[220px] h-11">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas categorias</SelectItem>
            {categorias.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ativoFilter} onValueChange={setAtivoFilter}>
          <SelectTrigger className="w-full lg:w-[160px] h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={sync} disabled={syncing} className="h-11 px-5 gap-2">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar Auge
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Itens" value={stats.total} />
        <StatBox label="Ativos" value={stats.ativos} tone="emerald" />
        <StatBox label="Com estoque" value={stats.comEstoque} tone="emerald" />
        <StatBox label="Sem estoque" value={stats.semEstoque} tone="amber" />
      </div>

      {lastSync && (
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Última sinc.: {formatDateBR(lastSync)} — {filtered.length} de {rows.length} exibidos
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">
            {rows.length === 0 ? 'Nenhum item sincronizado. Clique em "Sincronizar Auge".' : 'Nenhum resultado para o filtro.'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto border rounded-lg bg-card">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[160px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[150px]">Categoria</TableHead>
                  <TableHead className="w-[110px]">NCM</TableHead>
                  <TableHead className="w-[70px] text-center">UM</TableHead>
                  <TableHead className="w-[100px] text-right">Estoque</TableHead>
                  <TableHead className="w-[100px] text-right">Disponível</TableHead>
                  <TableHead className="w-[120px] text-center">Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {r.codigo}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="line-clamp-2" title={r.descricao || ''}>{r.descricao || '—'}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.categoria || '—'}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{r.ncm || '—'}</TableCell>
                    <TableCell className="text-xs text-center">
                      {r.unidade && <Badge variant="outline" className="text-[10px] font-mono">{r.unidade}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono">{fmtNum(r.qt_estoque)}</TableCell>
                    <TableCell className={`text-xs text-right font-mono font-bold ${(r.qt_disponivel || 0) > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {fmtNum(r.qt_disponivel)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Flag on={r.id_estoque} label="E" title="Estoca" />
                        <Flag on={r.id_venda} label="V" title="Vende" />
                        <Flag on={r.id_compra} label="C" title="Compra" />
                        <Flag on={r.ativo} label="A" title="Ativo" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mostrando {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="gap-1 h-8">
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>
              <span className="text-xs px-3">
                Página <strong>{safePage}</strong> de {totalPages}
              </span>
              <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="gap-1 h-8">
                Próximo <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' | 'red' }) {
  const toneCls =
    tone === 'emerald' ? 'text-emerald-500' :
    tone === 'amber' ? 'text-amber-500' :
    tone === 'red' ? 'text-red-500' : 'text-foreground';
  return (
    <div className="bg-card/60 border border-border/40 rounded-md p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className={`text-xl font-bold tracking-tight ${toneCls}`}>{value.toLocaleString('pt-BR')}</p>
    </div>
  );
}

function Flag({ on, label, title }: { on: boolean | null; label: string; title: string }) {
  const active = !!on;
  return (
    <span
      title={`${title}: ${active ? 'sim' : 'não'}`}
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold ${
        active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted/30 text-muted-foreground/40'
      }`}
    >
      {label}
    </span>
  );
}
