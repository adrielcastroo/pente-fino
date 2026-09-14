import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Database, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================
// Types — espelham a tabela auge_pedidos (dados reais do Auge)
// ============================================================

export interface PedidoAuge {
  id: string;
  cd_pedido: string;
  nr_pedido: string | null;
  nome_cliente: string | null;
  cliente_final: string | null;
  supervisor: string | null;
  dt_documento: string | null;
  dt_efetivacao: string | null;
  dt_entrega_prevista: string | null;
  vl_produtos: number;
  vl_impostos: number;
  vl_total: number;
  situacao_id: string | null;
  situacao: string | null;
  status_tms: string | null;
  nf_numero: string | null;
  nf_serie: string | null;
  sincronizado_em: string;
}

interface ConsultaPedidosProps {
  onPedidosSelecionados: (pedidos: PedidoAuge[]) => void;
}

// Cores por situação (baseado nos dados reais do Auge)
function getCorSituacao(situacao: string | null): string {
  const s = (situacao || '').toLowerCase();
  if (s.includes('digita')) return 'bg-blue-100 text-blue-800';
  if (s.includes('produ')) return 'bg-purple-100 text-purple-800';
  if (s.includes('efetivado')) return 'bg-green-100 text-green-800';
  if (s.includes('faturado')) return 'bg-emerald-100 text-emerald-800';
  if (s.includes('pronto')) return 'bg-orange-100 text-orange-800';
  if (s.includes('an')) return 'bg-yellow-100 text-yellow-800';
  if (s.includes('aprov')) return 'bg-cyan-100 text-cyan-800';
  if (s.includes('pendente')) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function formatarMoeda(valor: number | null): string {
  if (valor == null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export default function ConsultaPedidos({ onPedidosSelecionados }: ConsultaPedidosProps) {
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Busca pedidos do Auge através do sync process (para manter dados atualizados)
  // Refetch a cada 1 minuto para manter dados atualizados
  const { data: pedidos = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['auge_pedidos_sync'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('auge-sync', {
          body: { action: 'sync_pedidos' }
        });
        if (error) throw error;
        // O sync retorna a entidade 'pedidos' com seus dados mapeados
        return data?.pedidos ?? [];
      } catch (e) {
        console.error('[ConsultaPedidos] Erro ao sincronizar pedidos do Auge:', e);
        // Fallback para dados locais se o sync falhar (mantém a funcionalidade)
        const BATCH = 500;
        const all: PedidoAuge[] = [];
        let offset = 0;
        let hasMore = true;
        while (hasMore && all.length < 5000) {
          const { data, error } = await supabase
            .from('auge_pedidos')
            .select('*')
            .order('cd_pedido', { ascending: false })
            .range(offset, offset + BATCH - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          all.push(...(data as PedidoAuge[]));
          offset += BATCH;
          hasMore = data.length === BATCH;
        }
        return all;
      }
    },
    refetchInterval: 60000, // 1 minuto
    staleTime: 30000, // Considera dados antigos após 30 segundos
  });

  const situacoes = useMemo(() => {
    const set = new Map<string, number>();
    pedidos.forEach((p) => {
      const s = p.situacao || 'Sem situação';
      set.set(s, (set.get(s) || 0) + 1);
    });
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
  }, [pedidos]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return pedidos.filter((p) => {
      const matchesBusca =
        !q ||
        (p.nome_cliente || '').toLowerCase().includes(q) ||
        (p.cd_pedido || '').includes(q) ||
        (p.nr_pedido || '').includes(q) ||
        (p.supervisor || '').toLowerCase().includes(q);
      const matchesSit = filtroSituacao === 'todos' || (p.situacao || 'Sem situação') === filtroSituacao;
      return matchesBusca && matchesSit;
    });
  }, [pedidos, busca, filtroSituacao]);

  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Update last fetch time when data changes
  useEffect(() => {
    if (pedidos) {
      setLastFetchTime(new Date());
    }
  }, [pedidos]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroSituacao]);

  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const paginatedPedidos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtrados.slice(start, start + ITEMS_PER_PAGE);
  }, [filtrados, currentPage]);

  const stats = useMemo(
    () => ({
      total: pedidos.length,
      valor: pedidos.reduce((acc, p) => acc + (p.vl_total || 0), 0),
      selecionados: selecionados.size,
    }),
    [pedidos, selecionados],
  );

  const toggleSelecao = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selecionarTodos = () => {
    if (selecionados.size === filtrados.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(filtrados.map((p) => p.id)));
    }
  };

  const confirmarSelecao = () => {
    const sel = pedidos.filter((p) => selecionados.has(p.id));
    if (sel.length === 0) {
      toast.error('Selecione pelo menos um pedido');
      return;
    }
    onPedidosSelecionados(sel);
    toast.success(`${sel.length} pedidos enviados para o romaneio`);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Pedidos do Auge (sincronizados em tempo real)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-2 flex-1 min-w-[220px]">
              <Label htmlFor="busca">Buscar (cliente, pedido ou supervisor)</Label>
              <Input
                id="busca"
                placeholder="Ex: Monter, C1739, 176906..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {situacoes.map(([sit, qtd]) => (
                    <SelectItem key={sit} value={sit}>
                      {sit} ({qtd})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              {isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Atualizar
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <span>
              Total: <strong>{stats.total}</strong> pedidos
            </span>
            <span>
              Valor: <strong>{formatarMoeda(stats.valor)}</strong>
            </span>
            <span>
              Selecionados: <strong>{stats.selecionados}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de pedidos */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              Nenhum pedido encontrado. Clique em "Atualizar" para sincronizar com o Auge.
            </p>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={selecionarTodos}>
                  {selecionados.size === filtrados.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
                <Button size="sm" onClick={confirmarSelecao} disabled={selecionados.size === 0}>
                  Usar {selecionados.size} pedido(s) no romaneio
                </Button>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead className="min-w-[140px]">Cliente</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="hidden sm:table-cell">Data Doc.</TableHead>
                      <TableHead className="hidden sm:table-cell">Entrega</TableHead>
                      <TableHead className="hidden md:table-cell">NF</TableHead>
                      <TableHead className="hidden lg:table-cell">Supervisor</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPedidos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selecionados.has(p.id)}
                            onChange={() => toggleSelecao(p.id)}
                            className="w-4 h-4"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm">
                          {p.nr_pedido || p.cd_pedido}
                        </TableCell>
                        <TableCell className="max-w-[120px] sm:max-w-[220px] truncate text-xs sm:text-sm" title={p.nome_cliente || ''}>
                          {p.nome_cliente}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCorSituacao(p.situacao)} variant="secondary">
                            <span className="text-xs">{p.situacao || '-'}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">{p.dt_documento || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">{p.dt_entrega_prevista || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs">{p.nf_numero ? `${p.nf_numero}` : '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs truncate">{p.supervisor || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm">
                          {formatarMoeda(p.vl_total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtrados.length)} de {filtrados.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <span className="text-sm px-2 text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
