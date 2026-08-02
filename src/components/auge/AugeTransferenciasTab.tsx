import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { transferToast } from '@/lib/toast-flows';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FiltroColapsado from '@/components/erp/FiltroColapsado';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, Loader2, ArrowRightLeft, Search, Plus, Zap, MoreVertical, Pencil, Copy, Trash2, ArrowUpDown, ArrowUp, ArrowDown, CalendarDays, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateBR } from '@/lib/app-utils';
import { formatQty } from '@/lib/utils';
import TransferenciaDetailDialog from './TransferenciaDetailDialog';
import NovaTransferenciaDialog, { type TransfDialogInitial, type TransfDialogMode } from './NovaTransferenciaDialog';

type Filtro = 'rascunho' | 'efetivada';
type SortDirection = 'asc' | 'desc';
type SortKey = 'documento' | 'nr_efetivacao' | 'deposito' | 'codigo_produto' | 'descricao_produto' | 'quantidade' | 'usuario_criacao' | 'observacao' | 'data_movimento';

const SORT_LABELS: Record<SortKey, string> = {
  documento: 'Nº Rascunho',
  nr_efetivacao: 'Nº Efetivação',
  deposito: 'Origem → Destino',
  codigo_produto: 'Produto',
  descricao_produto: 'Descrição',
  quantidade: 'Qtd',
  usuario_criacao: 'Usuário',
  observacao: 'Observação',
  data_movimento: 'Data',
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase('pt-BR');
}

function sortValue(row: any, key: SortKey): string | number {
  if (key === 'deposito') return normalizeText(`${row.deposito_origem ?? ''} ${row.deposito_destino ?? ''}`);
  if (key === 'quantidade') return Number(row.quantidade ?? 0);
  if (key === 'data_movimento') return row.data_movimento ? new Date(row.data_movimento).getTime() : 0;
  return normalizeText(row[key]);
}

function endOfDayISO(date: string): string {
  return `${date}T23:59:59.999-03:00`;
}

function startOfDayISO(date: string): string {
  return `${date}T00:00:00.000-03:00`;
}

export default function AugeTransferenciasTab({
  autoInitial,
  onAutoInitialConsumed,
}: {
  autoInitial?: TransfDialogInitial | null;
  onAutoInitialConsumed?: () => void;
} = {}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('data_movimento');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Dialog Nova/Editar/Duplicar
  const [dialogMode, setDialogMode] = useState<TransfDialogMode>('novo');
  const [dialogInitial, setDialogInitial] = useState<TransfDialogInitial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Abre automaticamente quando vier initial de fora (ex.: /historico → Transferir)
  useEffect(() => {
    if (autoInitial) {
      setDialogMode('novo');
      setDialogInitial(autoInitial);
      setDialogOpen(true);
      onAutoInitialConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoInitial]);

  const isRascunho = (r: any) =>
    r.situacao === 'D' || r.situacao === '10' || r.situacao === 10 ||
    /rascunho|edi[çc][ãa]o|digit/i.test(r.ds_situacao ?? '');
  const isEfetivada = (r: any) => !!r.nr_efetivacao || /efetiv/i.test(r.ds_situacao ?? '');

  const efetivarRapido = async (row: any) => {
    if (!row?.documento) return;
    if (!confirm(`Efetivar transferência ${row.documento} no Auge? Isso movimenta estoque.`)) return;
    const t = toast.loading('Efetivando...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=transferencia_efetivar', {
        body: { cdMovimentacao: row.documento },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      transferToast.efetivada(row.documento, { id: t });
      await sync();
    } catch (e: any) {
      transferToast.erro(e, 'efetivação', { id: t });
    }
  };

  const abrirEdicao = (row: any) => {
    setDialogMode('editar');
    setDialogInitial({
      cdMovimentacao: row.documento,
      observacao: row.observacao ?? '',
      itens: [{
        cdItem: row.codigo_produto ?? '',
        cdDepositoOrigem: row.deposito_origem ?? '',
        cdDepositoDestino: row.deposito_destino ?? '',
        qtd: Number(row.quantidade ?? 0),
      }],
    });
    setDialogOpen(true);
  };

  const abrirDuplicar = (row: any) => {
    setDialogMode('duplicar');
    setDialogInitial({
      observacao: row.observacao ?? '',
      itens: [{
        cdItem: row.codigo_produto ?? '',
        cdDepositoOrigem: row.deposito_origem ?? '',
        cdDepositoDestino: row.deposito_destino ?? '',
        qtd: Number(row.quantidade ?? 0),
      }],
    });
    setDialogOpen(true);
  };

  const abrirNovo = () => {
    setDialogMode('novo');
    setDialogInitial(null);
    setDialogOpen(true);
  };

  const excluirRascunho = async (row: any) => {
    if (!row?.documento) return;
    if (!confirm(`Remover o rascunho ${row.documento} definitivamente do Auge e do Pente Fino?`)) return;
    const t = toast.loading('Removendo no Auge...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=transferencia_excluir', {
        body: { cdMovimentacao: row.documento },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      transferToast.removida(row.documento, { id: t });
      setRows(rs => rs.filter(r => r.id !== row.id));
      await sync();
    } catch (e: any) {
      transferToast.erro(e, 'remoção do rascunho', { id: t });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const pageSize = 1000;
    let transferencias: any[] = [];
    let from = 0;
    let errorMessage: string | null = null;

    while (true) {
      let query = (supabase as any)
        .from('auge_transferencias')
        .select('*')
        .order('data_movimento', { ascending: false, nullsFirst: false })
        .range(from, from + pageSize - 1);

      if (dateFrom) query = query.gte('data_movimento', startOfDayISO(dateFrom));
      if (dateTo) query = query.lte('data_movimento', endOfDayISO(dateTo));

      const { data, error } = await query;
      if (error) {
        errorMessage = error.message;
        break;
      }
      const page = data || [];
      transferencias = transferencias.concat(page);
      if (page.length < pageSize || (!dateFrom && !dateTo && transferencias.length >= 500)) break;
      from += pageSize;
    }

    if (errorMessage) toast.error(errorMessage);
    if (!dateFrom && !dateTo) transferencias = transferencias.slice(0, 500);
    const codigos = Array.from(new Set(
      transferencias.map((r: any) => r.codigo_produto).filter(Boolean)
    ));
    if (codigos.length > 0) {
      const { data: produtos } = await (supabase as any)
        .from('auge_produtos')
        .select('codigo, descricao')
        .in('codigo', codigos);
      const descricoes = new Map((produtos || []).map((p: any) => [p.codigo, p.descricao]));
      setRows(transferencias.map((r: any) => ({
        ...r,
        descricao_produto: r.descricao_produto ?? descricoes.get(r.codigo_produto) ?? null,
      })));
    } else {
      setRows(transferencias);
    }
    setLoading(false);
  }, [dateFrom, dateTo]);

  const sync = async () => {
    setSyncing(true);
    const t = toast.loading(dateFrom || dateTo ? 'Sincronizando período...' : 'Sincronizando transferências...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?entity=transferencias', {
        body: { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      const r = (data?.results ?? []).find((x: any) => x.entity === 'transferencias');
      if (r?.error) throw new Error(r.error);
      toast.success(`${r?.upserted ?? 0} transferências sincronizadas`, { id: t });
      await load();
    } catch (e: any) {
      toast.error('Falha: ' + (e.message || ''), { id: t });
    } finally { setSyncing(false); }
  };

  useEffect(() => { load(); }, [load]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const clearDates = () => {
    setDateFrom('');
    setDateTo('');
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = rows.filter(r => {
      if (filtro === 'rascunho' && !isRascunho(r)) return false;
      if (filtro === 'efetivada' && !isEfetivada(r)) return false;
      if (!q) return true;
      return (
        (r.codigo_produto || '').toLowerCase().includes(q) ||
        (r.descricao_produto || '').toLowerCase().includes(q) ||
        (r.documento || '').toLowerCase().includes(q) ||
        (r.nr_efetivacao || '').toLowerCase().includes(q) ||
        (r.deposito_origem || '').toLowerCase().includes(q) ||
        (r.deposito_destino || '').toLowerCase().includes(q) ||
        (r.observacao || '').toLowerCase().includes(q) ||
        (r.usuario_criacao || '').toLowerCase().includes(q)
      );
    });
    return [...base].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const result = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'pt-BR', { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? result : -result;
    });
  }, [rows, search, filtro, sortKey, sortDirection]);

  // Reset para página 1 quando filtros/ordenação/tamanho mudam
  useEffect(() => { setPage(1); }, [search, filtro, dateFrom, dateTo, sortKey, sortDirection, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paginated = useMemo(() => filtered.slice(startIdx, startIdx + pageSize), [filtered, startIdx, pageSize]);

  const SortableHead = ({ column, className }: { column: SortKey; className?: string }) => {
    const active = sortKey === column;
    const Icon = !active ? ArrowUpDown : sortDirection === 'asc' ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className} aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 -ml-2 px-2 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => toggleSort(column)}
          title={`Ordenar por ${SORT_LABELS[column]}`}
        >
          <span className="whitespace-nowrap">{SORT_LABELS[column]}</span>
          <Icon className="w-3.5 h-3.5" />
        </Button>
      </TableHead>
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-stretch gap-2 sm:gap-3 min-w-0">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rascunho, nº efetivação, produto, depósito, usuário..." className="pl-10 h-11 w-full" />
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="relative w-[150px]">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="pl-9 h-11 text-xs" aria-label="Data de início" />
          </div>
          <div className="relative w-[150px]">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="pl-9 h-11 text-xs" aria-label="Data final" />
          </div>
          {(dateFrom || dateTo) && (
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={clearDates} title="Limpar período">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <FiltroColapsado
          label="Filtro"
          value={filtro}
          onChange={(v) => setFiltro(v as Filtro | null)}
          opcoes={[
            { value: 'rascunho', label: 'Rascunhos', count: rows.filter(r => isRascunho(r) && !isEfetivada(r)).length },
            { value: 'efetivada', label: 'Efetivadas', count: rows.filter(isEfetivada).length },
          ]}
        />

        <Button onClick={abrirNovo} variant="default" className="h-11 px-4 sm:px-5 gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova</span>
        </Button>
      </div>


      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <ArrowRightLeft className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{rows.length === 0 ? 'Nenhuma transferência.' : 'Sem resultados.'}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 min-w-0 overflow-auto border rounded-lg bg-card">
          <Table className="min-w-[1080px]">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <SortableHead column="documento" className="whitespace-nowrap" />
                <SortableHead column="nr_efetivacao" className="whitespace-nowrap" />
                <SortableHead column="deposito" className="whitespace-nowrap" />
                <SortableHead column="codigo_produto" className="whitespace-nowrap" />
                <SortableHead column="descricao_produto" className="min-w-[260px] whitespace-nowrap" />
                <SortableHead column="quantidade" className="text-right whitespace-nowrap" />
                <SortableHead column="usuario_criacao" className="whitespace-nowrap" />
                <SortableHead column="observacao" className="max-w-[220px] whitespace-nowrap" />
                <SortableHead column="data_movimento" className="whitespace-nowrap" />
                <TableHead className="w-[80px] text-right whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(r => {
                const rascunho = isRascunho(r) && !isEfetivada(r);
                return (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => rascunho ? abrirEdicao(r) : setDetail(r)}>
                    <TableCell className="font-mono text-xs font-bold text-primary whitespace-nowrap">{r.documento || '—'}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {r.nr_efetivacao ? (
                        <span className="font-bold text-success">{r.nr_efetivacao}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <span className="font-mono">{r.deposito_origem || '?'}</span>
                      <ArrowRightLeft className="inline w-3 h-3 mx-1 text-muted-foreground" />
                      <span className="font-mono">{r.deposito_destino || '?'}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{r.codigo_produto || '—'}</TableCell>
                    <TableCell className="text-xs text-foreground max-w-[360px] truncate whitespace-nowrap" title={r.descricao_produto || ''}>
                      {r.descricao_produto || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs whitespace-nowrap">{formatQty(r.quantidade)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[140px] whitespace-nowrap" title={r.usuario_criacao || ''}>
                      {r.usuario_criacao || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate whitespace-nowrap" title={r.observacao || ''}>
                      {r.observacao || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.data_movimento ? formatDateBR(r.data_movimento) : '—'}</TableCell>

                    <TableCell className="p-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {rascunho && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-warning hover:text-warning" onClick={() => efetivarRapido(r)} title="Efetivar no Auge">
                            <Zap className="w-3 h-3" /> Efetivar
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {rascunho && (
                              <DropdownMenuItem onClick={() => abrirEdicao(r)}>
                                <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => abrirDuplicar(r)}>
                              <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDetail(r)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            {rascunho && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => excluirRascunho(r)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Remover rascunho
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="text-xs text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{startIdx + 1}</span>–
            <span className="font-medium text-foreground">{Math.min(startIdx + pageSize, filtered.length)}</span> de{' '}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Por página</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-9 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[25, 50, 100, 200].map(n => (
                    <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(1)} disabled={currentPage === 1} title="Primeira">
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} title="Anterior">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs px-2 whitespace-nowrap">Página <span className="font-medium text-foreground">{currentPage}</span> / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} title="Próxima">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} title="Última">
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <TransferenciaDetailDialog
        transferencia={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />
      <NovaTransferenciaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={dialogInitial}
        onCreated={() => sync()}
      />
    </div>
  );
}
