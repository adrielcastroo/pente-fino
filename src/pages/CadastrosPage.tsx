import { useState, useMemo } from 'react';
import { useItensCadastro, useDeleteItemCadastro } from '@/hooks/useItensCadastro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Search, Pencil, Trash2, Package, History } from 'lucide-react';
import ItemFormDialog from '@/components/cadastros/ItemFormDialog';
import ImportItensDialog from '@/components/cadastros/ImportItensDialog';
import { ItemCadastro } from '@/services/itensCadastroService';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldLabel } from '@/lib/audit';
import { cn } from '@/lib/utils';

type FornFilter = 'todos' | 'com' | 'sem';
type SortKey = 'codigo_interno' | 'descricao' | 'updated_at';

export default function CadastrosPage() {
  const { data: itens = [], isLoading } = useItensCadastro();
  const del = useDeleteItemCadastro();
  const [search, setSearch] = useState('');
  const [fornFilter, setFornFilter] = useState<FornFilter>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('codigo_interno');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<ItemCadastro | null>(null);
  const [toDelete, setToDelete] = useState<ItemCadastro | null>(null);

  const semFornecedorCount = useMemo(
    () => itens.filter((i) => !i.codigo_fornecedor || !i.codigo_fornecedor.trim()).length,
    [itens],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = itens;
    if (fornFilter === 'com') out = out.filter((i) => !!i.codigo_fornecedor && !!i.codigo_fornecedor.trim());
    else if (fornFilter === 'sem') out = out.filter((i) => !i.codigo_fornecedor || !i.codigo_fornecedor.trim());
    if (q) {
      out = out.filter(
        (i) =>
          i.codigo_interno.toLowerCase().includes(q) ||
          i.descricao.toLowerCase().includes(q) ||
          (i.codigo_fornecedor || '').toLowerCase().includes(q),
      );
    }
    const sorted = [...out].sort((a, b) => {
      if (sortKey === 'updated_at') return (b.updated_at || '').localeCompare(a.updated_at || '');
      if (sortKey === 'descricao') return a.descricao.localeCompare(b.descricao);
      return a.codigo_interno.localeCompare(b.codigo_interno);
    });
    return sorted;
  }, [itens, search, fornFilter, sortKey]);

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

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-4 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cadastro de Itens</h1>
            <p className="text-xs text-muted-foreground">
              Base usada para validar etiquetas: código interno + descrição + código fornecedor
            </p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Importar planilha
          </Button>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo item
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, descrição ou fornecedor..."
            className="pl-9 h-10"
          />
        </div>
        <Select value={fornFilter} onValueChange={(v) => setFornFilter(v as FornFilter)}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Mostrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os itens</SelectItem>
            <SelectItem value="com">Com cód. fornecedor</SelectItem>
            <SelectItem value="sem">Sem cód. fornecedor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-[180px] h-10">
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

      <TooltipProvider>
      <div className="flex-1 overflow-auto border rounded-lg bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
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
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {itens.length === 0 ? 'Nenhum item cadastrado. Importe uma planilha ou crie manualmente.' : 'Nenhum resultado para a busca.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((item) => {
              const lf = item.last_edited_field || null;
              const wasEdited = !!item.last_edited_at;
              const editedCol = (k: string) => lf === k;
              return (
              <TableRow key={item.id}>
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
                <TableCell className={cn(editedCol('codigo_fornecedor') && 'bg-amber-500/5')}>
                  <span className="inline-flex items-center gap-1.5">
                    {editedCol('codigo_fornecedor') && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                    {item.codigo_fornecedor && item.codigo_fornecedor.trim() ? (
                      <Badge variant="outline" className="font-mono text-[10px]">{item.codigo_fornecedor}</Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 italic">— sem código —</span>
                    )}
                  </span>
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
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setToDelete(item)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>
      </div>
      </TooltipProvider>

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
    </div>
  );
}
