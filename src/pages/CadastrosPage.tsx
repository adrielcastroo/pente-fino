import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useItensCadastro, useDeleteItemCadastro } from '@/hooks/useItensCadastro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, Pencil, Trash2, Package, History,
  ChevronLeft, ChevronRight, GitCompare, Sparkles,
  ArrowUp, ArrowDown, ArrowUpDown, Cloud, Loader2, Upload,
} from 'lucide-react';
import ItemFormDialog from '@/components/cadastros/ItemFormDialog';
import ImportItensDialog from '@/components/cadastros/ImportItensDialog';
import AugeReconciliacaoTab from '@/components/auge/AugeReconciliacaoTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ItemCadastro } from '@/services/itensCadastroService';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldLabel } from '@/lib/audit';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { normalizarCodigo } from '@/lib/codigoFornecedor';
import { PageHeader } from '@/components/ui/page-header';

type FornFilter = 'todos' | 'com' | 'sem' | 'pendentes_auge';
type EditFilter = 'todos' | 'editados' | 'nao_editados';
type SortKey = 'codigo_interno' | 'descricao' | 'codigo_fornecedor' | 'updated_at';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 50;

interface AugePendente {
  codigo: string;
  descricao: string | null;
  qt_disponivel: number | null;
  ativo: boolean | null;
}

interface AugeSearchHit {
  codigo: string;
  descricao: string | null;
  qt_disponivel: number | null;
}

export default function CadastrosPage() {
  useDocumentTitle('Cadastros');
  const qc = useQueryClient();
  const { data: itens = [], isLoading } = useItensCadastro();
  const del = useDeleteItemCadastro();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('id');
  const [search, setSearch] = useState('');
  const [fornFilter, setFornFilter] = useState<FornFilter>('todos');
  const [editFilter, setEditFilter] = useState<EditFilter>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('codigo_interno');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<ItemCadastro | null>(null);
  const [toDelete, setToDelete] = useState<ItemCadastro | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [augePendentes, setAugePendentes] = useState<AugePendente[]>([]);
  const [pendentesLoading, setPendentesLoading] = useState(false);
  const [augeHits, setAugeHits] = useState<AugeSearchHit[]>([]);
  const [augeHitsLoading, setAugeHitsLoading] = useState(false);

  const getCodigos = (i: ItemCadastro): string[] => {
    if (i.codigos_fornecedor && i.codigos_fornecedor.length) return i.codigos_fornecedor;
    return i.codigo_fornecedor ? [i.codigo_fornecedor] : [];
  };

  // Fetch Auge products missing from itens_cadastro
  useEffect(() => {
    if (fornFilter !== 'pendentes_auge' || isLoading) return;
    let alive = true;
    (async () => {
      setPendentesLoading(true);
      try {
        const cadastrados = new Set(itens.map((i) => normalizarCodigo(i.codigo_interno)));
        const all: any[] = [];
        for (let from = 0; from < 40000; from += 1000) {
          const { data, error } = await (supabase as any)
            .from('auge_produtos')
            .select('codigo, descricao, qt_disponivel, ativo')
            .eq('ativo', true)
            .range(from, from + 999);
          if (error) throw error;
          all.push(...(data || []));
          if ((data || []).length < 1000) break;
        }
        const pend = all
          .filter((a) => !cadastrados.has(normalizarCodigo(a.codigo)))
          .map((a) => ({ codigo: String(a.codigo), descricao: a.descricao, qt_disponivel: a.qt_disponivel, ativo: a.ativo }))
          .sort((a, b) => a.codigo.localeCompare(b.codigo));
        if (alive) setAugePendentes(pend);
      } catch (e: any) {
        toast.error('Erro ao buscar pendentes Auge: ' + (e?.message || ''));
      } finally {
        if (alive) setPendentesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [fornFilter, isLoading, itens]);

  // Debounced Auge search (in-place, no popup) — substitui o botão "Consultar Auge"
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2 || fornFilter === 'pendentes_auge') {
      setAugeHits([]);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      setAugeHitsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('auge_produtos')
          .select('codigo, descricao, qt_disponivel')
          .or(`codigo.ilike.%${q}%,descricao.ilike.%${q}%`)
          .limit(20);
        if (error) throw error;
        if (alive) setAugeHits((data || []) as AugeSearchHit[]);
      } catch {
        if (alive) setAugeHits([]);
      } finally {
        if (alive) setAugeHitsLoading(false);
      }
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [search, fornFilter]);

  // Realtime — durante uma sync do Auge chegam milhares de eventos em rajada.
  // Debounçamos e só invalidamos ao FIM do run (auge_sync_runs=success) para
  // não refazer o refetch paginado de itens_cadastro (3k+ linhas) a cada evento.
  useEffect(() => {
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (pendingTimer) return;
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        qc.invalidateQueries({ queryKey: ['auge_produtos'] });
        if (fornFilter === 'pendentes_auge') setAugePendentes((p) => [...p]);
      }, 2000);
    };
    const channel = (supabase as any)
      .channel('auge-live-cadastros')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auge_sync_runs' }, (payload: any) => {
        if (payload?.new?.status === 'success') {
          // Auge sync escreve em auge_produtos — nunca em itens_cadastro.
          // Invalidar itens_cadastro aqui gerava refetch paginado de 3k+ linhas
          // sem necessidade e saturava o DB (chegava a derrubar o /token do auth).
          qc.invalidateQueries({ queryKey: ['auge_produtos'] });
          if (fornFilter === 'pendentes_auge') setAugePendentes((p) => [...p]);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auge_produtos' }, scheduleRefresh)
      .subscribe();
    return () => {
      if (pendingTimer) clearTimeout(pendingTimer);
      (supabase as any).removeChannel(channel);
    };
  }, [qc, fornFilter]);

  const semFornecedorCount = useMemo(
    () => itens.filter((i) => getCodigos(i).length === 0).length,
    [itens],
  );
  const editadosCount = useMemo(
    () => itens.filter((i) => !!i.last_edited_at).length,
    [itens],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = itens;
    if (fornFilter === 'com') out = out.filter((i) => getCodigos(i).length > 0);
    else if (fornFilter === 'sem') out = out.filter((i) => getCodigos(i).length === 0);
    if (editFilter === 'editados') out = out.filter((i) => !!i.last_edited_at);
    else if (editFilter === 'nao_editados') out = out.filter((i) => !i.last_edited_at);
    if (q) {
      out = out.filter(
        (i) =>
          i.codigo_interno.toLowerCase().includes(q) ||
          i.descricao.toLowerCase().includes(q) ||
          getCodigos(i).some((c) => c.toLowerCase().includes(q)),
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...out].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'updated_at') cmp = (a.updated_at || '').localeCompare(b.updated_at || '');
      else if (sortKey === 'descricao') cmp = a.descricao.localeCompare(b.descricao);
      else if (sortKey === 'codigo_fornecedor') cmp = (getCodigos(a)[0] || '').localeCompare(getCodigos(b)[0] || '');
      else cmp = a.codigo_interno.localeCompare(b.codigo_interno, undefined, { numeric: true });
      return cmp * dir;
    });
    return sorted;
  }, [itens, search, fornFilter, editFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filtered.length);
  const paged = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

  useEffect(() => { setPage(1); }, [search, fornFilter, editFilter, sortKey, sortDir]);

  useEffect(() => {
    if (!highlightId || filtered.length === 0) return;
    const idx = filtered.findIndex(i => i.id === highlightId);
    if (idx >= 0) {
      setPage(Math.floor(idx / PAGE_SIZE) + 1);
      setTimeout(() => {
        document.getElementById(`cad-row-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightId, filtered]);

  const handleEdit = (item: ItemCadastro) => { setEditing(item); setFormOpen(true); };
  const handleNew = () => { setEditing(null); setFormOpen(true); };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success('Item excluído');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir');
    } finally {
      setToDelete(null);
    }
  };

  const pageIds = paged.map(i => i.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const togglePageAll = (checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) pageIds.forEach(id => next.add(id));
      else pageIds.forEach(id => next.delete(id));
      return next;
    });
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const selectAllFiltered = () => setSelected(new Set(filtered.map(i => i.id)));
  const clearSelection = () => setSelected(new Set());

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    let ok = 0, fail = 0;
    for (const id of ids) {
      try { await del.mutateAsync(id); ok++; } catch { fail++; }
    }
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
    clearSelection();
    if (fail === 0) toast.success(`${ok} ${ok === 1 ? 'item excluído' : 'itens excluídos'}`);
    else toast.warning(`${ok} excluído(s), ${fail} falha(s)`);
  };

  const clearDeepLink = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('id');
    setSearchParams(next, { replace: true });
  };

  const pageNumbers = useMemo(() => {
    const set = new Set<number>([1, totalPages, safePage, safePage - 1, safePage + 1]);
    return Array.from(set).filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  }, [safePage, totalPages]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const SortableHead: React.FC<{ k: SortKey; className?: string; children: React.ReactNode }> = ({ k, className, children }) => (
    <TableHead className={cn('cursor-pointer select-none hover:bg-muted/40 transition-colors', className)} onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1.5">
        {children}
        <SortIcon k={k} />
      </span>
    </TableHead>
  );

  // Itens do Auge encontrados na busca que ainda não estão cadastrados
  const augeHitsPendentes = useMemo(() => {
    const cadastrados = new Set(itens.map((i) => normalizarCodigo(i.codigo_interno)));
    return augeHits.filter((h) => !cadastrados.has(normalizarCodigo(h.codigo)));
  }, [augeHits, itens]);

  return (
    <div className="flex flex-col h-full min-w-0 gap-4 overflow-hidden">
      <PageHeader
        title="Cadastro de Itens"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="gap-2 h-10"
              aria-label="Importar itens"
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span className="truncate">Importar</span>
            </Button>
            <Button onClick={handleNew} className="gap-2 h-10" aria-label="Novo item">
              <Plus className="h-4 w-4 shrink-0" />
              <span className="truncate">Novo item</span>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="interno" className="flex-1 flex flex-col overflow-hidden gap-3 sm:gap-4 min-w-0">
        <TabsList className="w-full sm:w-fit overflow-x-auto no-scrollbar">
          <TabsTrigger value="interno" className="gap-2 flex-1 sm:flex-none">
            <Package className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Cadastro interno</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliacao" className="gap-2 flex-1 sm:flex-none">
            <GitCompare className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Reconciliação</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interno" className="flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden mt-0 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative w-full md:flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar em Cadastro + Auge (código, descrição, fornecedor)..."
                className="pl-9 pr-9 h-10 w-full"
                aria-label="Buscar itens (inclui Auge)"
              />
              {augeHitsLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:contents min-w-0">
              <Select value={fornFilter} onValueChange={(v) => setFornFilter(v as FornFilter)}>
                <SelectTrigger className="flex-1 min-w-[140px] md:w-[200px] md:flex-none h-10" aria-label="Filtrar por fornecedor">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os itens</SelectItem>
                  <SelectItem value="com">Com cód. fornecedor</SelectItem>
                  <SelectItem value="sem">Sem cód. fornecedor</SelectItem>
                  <SelectItem value="pendentes_auge">Pendentes do Auge</SelectItem>
                </SelectContent>
              </Select>
              <Select value={editFilter} onValueChange={(v) => setEditFilter(v as EditFilter)}>
                <SelectTrigger className="flex-1 min-w-[140px] md:w-[170px] md:flex-none h-10" aria-label="Filtrar por edição">
                  <SelectValue placeholder="Edição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas edições</SelectItem>
                  <SelectItem value="editados">Editados</SelectItem>
                  <SelectItem value="nao_editados">Nunca editados</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:ml-auto">
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{filtered.length} de {itens.length}</Badge>
                {semFornecedorCount > 0 && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs text-warning dark:text-warning border-amber-500/30">
                    {semFornecedorCount} sem fornecedor
                  </Badge>
                )}
                {editadosCount > 0 && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {editadosCount} editados
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Auge inline hits — só quando há busca e itens do Auge fora do cadastro */}
          {search.trim().length >= 2 && fornFilter !== 'pendentes_auge' && augeHitsPendentes.length > 0 && (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300">
                <Cloud className="h-3.5 w-3.5" />
                {augeHitsPendentes.length} {augeHitsPendentes.length === 1 ? 'item encontrado no Auge' : 'itens encontrados no Auge'} — ainda não cadastrados
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-auto">
                {augeHitsPendentes.map((h) => (
                  <div key={h.codigo} className="flex items-center gap-2 rounded-md bg-background/60 px-2 py-1.5 text-xs">
                    <span className="font-mono font-bold text-primary shrink-0 w-24 truncate">{h.codigo}</span>
                    <span className="flex-1 truncate">{h.descricao || '—'}</span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {h.qt_disponivel != null ? Number(h.qt_disponivel).toLocaleString('pt-BR') : '—'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 shrink-0"
                      onClick={() => {
                        setEditing({ codigo_interno: h.codigo, descricao: h.descricao || '', codigos_fornecedor: [] } as any);
                        setFormOpen(true);
                      }}
                    >
                      <Sparkles className="h-3 w-3" /> Cadastrar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {highlightId && filtered.some(i => i.id === highlightId) && (
            <div role="status" className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs flex items-center justify-between gap-3">
              <span>Item de destaque do link compartilhado.</span>
              <Button size="sm" variant="ghost" onClick={clearDeepLink} className="h-7">Limpar</Button>
            </div>
          )}

          {someSelected && (
            <div role="region" aria-label="Ações em lote" className="rounded-lg border bg-card px-3 py-2 flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xs sm:text-sm font-medium">{selected.size} selecionado(s)</span>
              <Button size="sm" variant="ghost" onClick={clearSelection} className="h-8">Limpar</Button>
              {selected.size < filtered.length && (
                <Button size="sm" variant="ghost" onClick={selectAllFiltered} className="h-8 text-xs">
                  <span className="hidden sm:inline">Selecionar todos os {filtered.length}</span>
                  <span className="sm:hidden">Todos ({filtered.length})</span>
                </Button>
              )}
              <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
                <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} className="gap-1.5 w-full sm:w-auto h-9" aria-label="Excluir selecionados">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir selecionados
                </Button>
              </div>
            </div>
          )}

          <TooltipProvider>
            {fornFilter === 'pendentes_auge' ? (
              <div className="flex-1 overflow-auto border rounded-lg bg-card">
                {pendentesLoading ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">Buscando itens do Auge...</p>
                ) : augePendentes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">Nenhum item do Auge pendente — tudo cadastrado. 🎉</p>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="w-[180px]">Código Auge</TableHead>
                        <TableHead>Descrição (Auge)</TableHead>
                        <TableHead className="w-[100px] text-right">Qt disp.</TableHead>
                        <TableHead className="w-[140px] text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {augePendentes.slice(0, 500).map((p) => {
                        const q = search.trim().toLowerCase();
                        if (q && !p.codigo.toLowerCase().includes(q) && !(p.descricao || '').toLowerCase().includes(q)) return null;
                        return (
                          <TableRow key={p.codigo}>
                            <TableCell className="font-mono text-xs font-bold text-primary">{p.codigo}</TableCell>
                            <TableCell className="text-xs">{p.descricao || <span className="text-muted-foreground/40">—</span>}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{p.qt_disponivel != null ? Number(p.qt_disponivel).toLocaleString('pt-BR') : '—'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 h-8"
                                onClick={() => {
                                  setEditing({ codigo_interno: p.codigo, descricao: p.descricao || '', codigos_fornecedor: [] } as any);
                                  setFormOpen(true);
                                }}
                              >
                                <Sparkles className="h-3.5 w-3.5" /> Cadastrar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                {augePendentes.length > 500 && (
                  <p className="text-center py-3 text-xs text-muted-foreground">Exibindo 500 de {augePendentes.length}. Refine com a busca.</p>
                )}
              </div>
            ) : (<>
              {/* Mobile */}
              <div className="md:hidden flex-1 overflow-auto space-y-2">
                {isLoading && <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>}
                {!isLoading && filtered.length === 0 && (
                  <p className="text-center text-muted-foreground py-12 text-sm">
                    {itens.length === 0 ? 'Nenhum item cadastrado.' : 'Nenhum resultado.'}
                  </p>
                )}
                {paged.map((item) => {
                  const codigos = getCodigos(item);
                  const isHighlight = item.id === highlightId;
                  const isSelected = selected.has(item.id);
                  return (
                    <div
                      key={item.id}
                      id={`cad-row-${item.id}`}
                      className={cn(
                        'rounded-lg border bg-card p-3 flex flex-col gap-2',
                        isHighlight && 'ring-2 ring-primary border-primary/40',
                        isSelected && 'bg-primary/5',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <Checkbox checked={isSelected} onCheckedChange={(c) => toggleOne(item.id, !!c)} aria-label={`Selecionar ${item.codigo_interno}`} className="mt-1" />
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-xs text-primary font-bold">{item.codigo_interno}</div>
                            <div className="text-sm font-medium mt-0.5 line-clamp-2">{item.descricao}</div>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleEdit(item)} aria-label="Editar item">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => setToDelete(item)} aria-label="Excluir item">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {codigos.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {codigos.slice(0, 4).map((c, i) => (
                            <Badge key={`${c}-${i}`} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                          ))}
                          {codigos.length > 4 && <Badge variant="secondary" className="text-[10px]">+{codigos.length - 4}</Badge>}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">sem código fornecedor</span>
                      )}
                      <div className="text-[10px] text-muted-foreground">
                        Atualizado em {new Date(item.updated_at).toLocaleDateString('pt-BR')}
                        {item.last_edited_at && <span className="ml-2 text-warning dark:text-warning">• editado</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop */}
              <div className="hidden md:block flex-1 overflow-auto border rounded-lg bg-card">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-[44px]">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={(c) => togglePageAll(!!c)}
                          aria-label="Selecionar todos da página"
                          className="h-5 w-5"
                        />
                      </TableHead>
                      <SortableHead k="codigo_interno" className="w-[200px]">Código interno</SortableHead>
                      <SortableHead k="descricao">Descrição</SortableHead>
                      <SortableHead k="codigo_fornecedor" className="w-[200px]">Código fornecedor</SortableHead>
                      <SortableHead k="updated_at" className="w-[140px]">Atualizado</SortableHead>
                      <TableHead className="w-[110px] text-center">Edição</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                    )}
                    {!isLoading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          {itens.length === 0 ? 'Nenhum item cadastrado. Sincronize via Auge no /admin.' : 'Nenhum resultado para a busca.'}
                        </TableCell>
                      </TableRow>
                    )}
                    {paged.map((item) => {
                      const lf = item.last_edited_field || null;
                      const wasEdited = !!item.last_edited_at;
                      const editedCol = (k: string) => lf === k;
                      const isHighlight = item.id === highlightId;
                      const isSelected = selected.has(item.id);
                      return (
                        <TableRow
                          key={item.id}
                          id={`cad-row-${item.id}`}
                          className={cn(
                            isHighlight && 'bg-primary/10 ring-1 ring-primary/40',
                            isSelected && !isHighlight && 'bg-primary/5',
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(c) => toggleOne(item.id, !!c)}
                              aria-label={`Selecionar ${item.codigo_interno}`}
                              className="h-5 w-5"
                            />
                          </TableCell>
                          <TableCell className={cn('font-mono text-xs', editedCol('codigo_interno') && 'bg-amber-500/5')}>
                            <span className="inline-flex items-center gap-1.5">
                              {editedCol('codigo_interno') && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                              {item.codigo_interno}
                            </span>
                          </TableCell>
                          <TableCell className={cn('text-xs max-w-xl', editedCol('descricao') && 'bg-amber-500/5')}>
                            <div className="line-clamp-2 inline-flex items-start gap-1.5" title={item.descricao}>
                              {editedCol('descricao') && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
                              <span>{item.descricao}</span>
                            </div>
                          </TableCell>
                          <TableCell className={cn((editedCol('codigo_fornecedor') || editedCol('codigos_fornecedor')) && 'bg-amber-500/5')}>
                            <div className="inline-flex items-start gap-1.5 flex-wrap max-w-[240px]">
                              {(editedCol('codigo_fornecedor') || editedCol('codigos_fornecedor')) && (
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                              )}
                              {(() => {
                                const codigos = getCodigos(item);
                                if (!codigos.length) {
                                  return <span className="text-[10px] text-muted-foreground/60 italic">— sem código —</span>;
                                }
                                const visiveis = codigos.slice(0, 3);
                                const extras = codigos.length - visiveis.length;
                                return (
                                  <>
                                    {visiveis.map((c, i) => (
                                      <Badge key={`${c}-${i}`} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                                    ))}
                                    {extras > 0 && (
                                      <Badge variant="secondary" className="text-[10px]" title={codigos.slice(3).join(', ')}>
                                        +{extras}
                                      </Badge>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(item.updated_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-center">
                            {wasEdited ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/5 text-warning dark:text-warning font-medium text-[10px] cursor-help">
                                    <History className="w-3 h-3" />
                                    editado
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs">
                                  <div className="font-semibold">{item.updated_by_name || 'Usuário'}</div>
                                  <div className="text-muted-foreground">
                                    alterou <span className="font-medium text-foreground">{fieldLabel(lf) || '—'}</span>
                                  </div>
                                  <div className="text-muted-foreground mt-1">
                                    {item.last_edited_at ? new Date(item.last_edited_at).toLocaleString('pt-BR') : ''}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground/40 text-[10px]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-10 w-10 lg:h-9 lg:w-9" onClick={() => handleEdit(item)} aria-label="Editar item">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-10 w-10 lg:h-9 lg:w-9 text-destructive hover:text-destructive" onClick={() => setToDelete(item)} aria-label="Excluir item">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>)}
          </TooltipProvider>

          {fornFilter !== 'pendentes_auge' && filtered.length > 0 && (
            <nav aria-label="Paginação" className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 border-t border-border/40 pt-3 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center sm:text-left">
                Mostrando {start + 1}–{end} de {filtered.length}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1 min-w-0">
                <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Página anterior" className="gap-1 h-8 px-2">
                  <ChevronLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Anterior</span>
                </Button>
                {pageNumbers.map((n, i) => {
                  const prev = pageNumbers[i - 1];
                  const showEllipsis = prev !== undefined && n - prev > 1;
                  return (
                    <span key={n} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-muted-foreground/60 text-xs">…</span>}
                      <Button
                        size="sm"
                        variant={n === safePage ? 'default' : 'outline'}
                        onClick={() => setPage(n)}
                        className="h-8 min-w-[32px] px-2"
                        aria-label={`Página ${n}`}
                        aria-current={n === safePage ? 'page' : undefined}
                      >
                        {n}
                      </Button>
                    </span>
                  );
                })}
                <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} aria-label="Próxima página" className="gap-1 h-8 px-2">
                  <span className="hidden sm:inline">Próximo</span> <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </nav>
          )}
        </TabsContent>

        <TabsContent value="reconciliacao" className="flex-1 overflow-hidden mt-0">
          <AugeReconciliacaoTab />
        </TabsContent>
      </Tabs>

      <ItemFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <ImportItensDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>
              O item <span className="font-mono">{toDelete?.codigo_interno}</span> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} {selected.size === 1 ? 'item' : 'itens'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente os itens selecionados. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleting ? 'Excluindo...' : 'Excluir tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
