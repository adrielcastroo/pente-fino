import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useItensCadastro, useDeleteItemCadastro } from '@/hooks/useItensCadastro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Search, Pencil, Trash2, Package, History, ChevronLeft, ChevronRight } from 'lucide-react';
import ItemFormDialog from '@/components/cadastros/ItemFormDialog';
import ImportItensDialog from '@/components/cadastros/ImportItensDialog';
import AugeItemLookup from '@/components/auge/AugeItemLookup';
import AugeProdutosTab from '@/components/auge/AugeProdutosTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ItemCadastro } from '@/services/itensCadastroService';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldLabel } from '@/lib/audit';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type FornFilter = 'todos' | 'com' | 'sem';
type SortKey = 'codigo_interno' | 'descricao' | 'updated_at';
const PAGE_SIZE = 50;

export default function CadastrosPage() {
  useDocumentTitle('Cadastros');
  const { data: itens = [], isLoading } = useItensCadastro();
  const del = useDeleteItemCadastro();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('id');
  const [search, setSearch] = useState('');
  const [fornFilter, setFornFilter] = useState<FornFilter>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('codigo_interno');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<ItemCadastro | null>(null);
  const [toDelete, setToDelete] = useState<ItemCadastro | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const getCodigos = (i: ItemCadastro): string[] => {
    if (i.codigos_fornecedor && i.codigos_fornecedor.length) return i.codigos_fornecedor;
    return i.codigo_fornecedor ? [i.codigo_fornecedor] : [];
  };

  const semFornecedorCount = useMemo(
    () => itens.filter((i) => getCodigos(i).length === 0).length,
    [itens],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = itens;
    if (fornFilter === 'com') out = out.filter((i) => getCodigos(i).length > 0);
    else if (fornFilter === 'sem') out = out.filter((i) => getCodigos(i).length === 0);
    if (q) {
      out = out.filter(
        (i) =>
          i.codigo_interno.toLowerCase().includes(q) ||
          i.descricao.toLowerCase().includes(q) ||
          getCodigos(i).some((c) => c.toLowerCase().includes(q)),
      );
    }
    const sorted = [...out].sort((a, b) => {
      if (sortKey === 'updated_at') return (b.updated_at || '').localeCompare(a.updated_at || '');
      if (sortKey === 'descricao') return a.descricao.localeCompare(b.descricao);
      return a.codigo_interno.localeCompare(b.codigo_interno);
    });
    return sorted;
  }, [itens, search, fornFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filtered.length);
  const paged = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, fornFilter, sortKey]);

  // Deep link: when ?id= is set, jump to the page containing that item and highlight
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

  const handleEdit = (item: ItemCadastro) => {
    setEditing(item);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

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

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map(i => i.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    let ok = 0;
    let fail = 0;
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

  // Page numbers to display: first, last, current ±2, with ellipses
  const pageNumbers = useMemo(() => {
    const set = new Set<number>([1, totalPages, safePage, safePage - 1, safePage + 1]);
    return Array.from(set).filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  }, [safePage, totalPages]);

  return (
    <div className="flex flex-col h-full min-w-0 p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Cadastro de Itens</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Base usada para validar etiquetas: código interno + descrição + código fornecedor
          </p>
        </div>
        <div className="md:ml-auto flex flex-wrap items-center gap-2 min-w-0">
          <AugeItemLookup />
          <Button variant="outline" onClick={() => setImportOpen(true)} className="flex-1 md:flex-none sm:min-w-[150px] h-10" aria-label="Importar planilha">
            <Upload className="h-4 w-4 sm:mr-2 shrink-0" />
            <span className="truncate hidden sm:inline">Importar planilha</span>
            <span className="truncate sm:hidden">Importar</span>
          </Button>
          <Button onClick={handleNew} className="gap-2 flex-1 md:flex-none sm:min-w-[130px] h-10" aria-label="Novo item">
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">Novo item</span>
          </Button>
        </div>
      </header>

      <Tabs defaultValue="interno" className="flex-1 flex flex-col overflow-hidden gap-3 sm:gap-4 min-w-0">
        <TabsList className="w-full sm:w-fit overflow-x-auto no-scrollbar">
          <TabsTrigger value="interno" className="gap-2 flex-1 sm:flex-none">
            <Package className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Cadastro interno</span>
          </TabsTrigger>
          <TabsTrigger value="auge" className="gap-2 flex-1 sm:flex-none">
            <History className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Auge (ERP)</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interno" className="flex-1 flex flex-col gap-4 overflow-hidden mt-0">
      <div className="flex flex-col md:flex-row md:items-center gap-3">

        <div className="relative w-full md:flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, descrição ou fornecedor..."
            className="pl-9 h-10"
            aria-label="Buscar itens"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:contents">
        <Select value={fornFilter} onValueChange={(v) => setFornFilter(v as FornFilter)}>
          <SelectTrigger className="flex-1 min-w-[140px] md:w-[180px] md:flex-none h-10" aria-label="Filtrar por fornecedor">
            <SelectValue placeholder="Mostrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os itens</SelectItem>
            <SelectItem value="com">Com cód. fornecedor</SelectItem>
            <SelectItem value="sem">Sem cód. fornecedor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="flex-1 min-w-[140px] md:w-[180px] md:flex-none h-10" aria-label="Ordenar">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="codigo_interno">Código interno</SelectItem>
            <SelectItem value="descricao">Descrição</SelectItem>
            <SelectItem value="updated_at">Atualizado recente</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 md:ml-auto">
          <Badge variant="secondary">{filtered.length} de {itens.length}</Badge>
          {semFornecedorCount > 0 && (
            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30">
              {semFornecedorCount} sem fornecedor
            </Badge>
          )}
        </div>
        </div>
      </div>

      {/* Highlight banner from deep link */}
      {highlightId && filtered.some(i => i.id === highlightId) && (
        <div role="status" className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs flex items-center justify-between gap-3">
          <span>Item de destaque do link compartilhado.</span>
          <Button size="sm" variant="ghost" onClick={clearDeepLink} className="h-7">Limpar</Button>
        </div>
      )}

      {/* Bulk action bar */}
      {someSelected && (
        <div role="region" aria-label="Ações em lote" className="rounded-lg border bg-card px-3 py-2 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{selected.size} selecionado(s)</span>
          <Button size="sm" variant="ghost" onClick={clearSelection}>Limpar</Button>
          {selected.size < filtered.length && (
            <Button size="sm" variant="ghost" onClick={selectAllFiltered}>Selecionar todos os {filtered.length}</Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} className="gap-1.5" aria-label="Excluir selecionados">
              <Trash2 className="h-3.5 w-3.5" /> Excluir selecionados
            </Button>
          </div>
        </div>
      )}

      <TooltipProvider>
      {/* Mobile: cards empilhados */}
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
                {item.last_edited_at && <span className="ml-2 text-amber-600 dark:text-amber-400">• editado</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/tablet: tabela */}
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
              <TableHead className="w-[200px]">Código interno</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[200px]">Código fornecedor</TableHead>
              <TableHead className="w-[140px]">Atualizado</TableHead>
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
                  {itens.length === 0 ? 'Nenhum item cadastrado. Importe uma planilha ou crie manualmente.' : 'Nenhum resultado para a busca.'}
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
                        <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-medium text-[10px] cursor-help">
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
            );})}
          </TableBody>
        </Table>
      </div>
      </TooltipProvider>

      {/* Pagination */}
      {filtered.length > 0 && (
        <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mostrando {start + 1}–{end} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              aria-label="Página anterior"
              className="gap-1 h-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
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
            <Button
              size="sm"
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              aria-label="Próxima página"
              className="gap-1 h-8"
            >
              Próximo <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </nav>
      )}
        </TabsContent>

        <TabsContent value="auge" className="flex-1 overflow-hidden mt-0">
          <AugeProdutosTab />
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
