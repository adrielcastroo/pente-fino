import { useState, useMemo } from 'react';
import { useItensCadastro, useDeleteItemCadastro } from '@/hooks/useItensCadastro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Search, Pencil, Trash2, Package } from 'lucide-react';
import ItemFormDialog from '@/components/cadastros/ItemFormDialog';
import ImportItensDialog from '@/components/cadastros/ImportItensDialog';
import { ItemCadastro } from '@/services/itensCadastroService';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function CadastrosPage() {
  const { data: itens = [], isLoading } = useItensCadastro();
  const del = useDeleteItemCadastro();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<ItemCadastro | null>(null);
  const [toDelete, setToDelete] = useState<ItemCadastro | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return itens;
    return itens.filter(
      (i) =>
        i.codigo_interno.toLowerCase().includes(q) ||
        i.descricao.toLowerCase().includes(q) ||
        i.codigo_fornecedor.toLowerCase().includes(q),
    );
  }, [itens, search]);

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

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, descrição ou fornecedor..."
            className="pl-9 h-10"
          />
        </div>
        <Badge variant="secondary">{filtered.length} de {itens.length}</Badge>
      </div>

      <div className="flex-1 overflow-auto border rounded-lg bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-[200px]">Código interno</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[200px]">Código fornecedor</TableHead>
              <TableHead className="w-[140px]">Atualizado</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  {itens.length === 0 ? 'Nenhum item cadastrado. Importe uma planilha ou crie manualmente.' : 'Nenhum resultado para a busca.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.codigo_interno}</TableCell>
                <TableCell className="text-xs max-w-xl">
                  <div className="line-clamp-2" title={item.descricao}>{item.descricao}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px]">{item.codigo_fornecedor}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(item.updated_at).toLocaleDateString('pt-BR')}
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
            ))}
          </TableBody>
        </Table>
      </div>

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
