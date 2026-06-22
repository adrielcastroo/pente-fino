import { useState, memo } from 'react';
import { Reserva } from '@/types';
import { EmptyState } from '@/components/ui/empty-state';
import { calculateTotal } from './reservas-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { MapPin, Hash, MessageSquare, Package, Trash2, AlertTriangle, Pencil, History } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fieldLabel } from '@/lib/audit';
import { cn } from '@/lib/utils';

interface ReservasTableProps {
  items: Reserva[];
  onDelete: (id: string) => void;
  onEdit?: (reserva: Reserva) => void;
}

// Visual indicator for an edited cell
const EditedCell = ({ edited, children }: { edited: boolean; children: React.ReactNode }) => (
  <span className={cn('inline-flex items-center gap-1.5', edited && 'relative')}>
    {edited && (
      <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden />
    )}
    {children}
  </span>
);

const ReservasTable = ({ items, onDelete, onEdit }: ReservasTableProps) => {
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="overflow-x-auto relative w-full custom-scrollbar overscroll-x-contain">
      <Table className="min-w-[800px] lg:min-w-full">
        <TableHeader className="bg-muted/30 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground py-4 px-6">Código</TableHead>
            <TableHead className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground py-4">Endereço</TableHead>
            <TableHead className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Quantidade</TableHead>
            <TableHead className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Quantidade CX</TableHead>
            <TableHead className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Nº CX</TableHead>
            <TableHead className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground py-4">OBS</TableHead>
            <TableHead className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-right pr-6">Total</TableHead>
            <TableHead className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Edição</TableHead>
            <TableHead className="w-24 py-4 pr-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                <EmptyState
                  icon={Package}
                  title="Prateleira virtual vazia"
                  description="Nenhum item reservado no momento. Crie uma nova reserva para começar."
                />
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const lf = item.lastEditedField || null;
              const editedCols = new Set([lf]);
              const wasEdited = !!item.lastEditedAt;
              return (
              <TableRow
                key={item.id}
                className="group hover:bg-primary/[0.02] transition-colors border-b border-border/30"
              >
                <TableCell className={cn('font-mono font-semibold text-primary px-6 py-4', editedCols.has('codigo') && 'bg-amber-500/5')}>
                  <EditedCell edited={editedCols.has('codigo')}>{item.codigo}</EditedCell>
                </TableCell>
                <TableCell className={cn(editedCols.has('endereco') && 'bg-amber-500/5')}>
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary/60" />
                    <EditedCell edited={editedCols.has('endereco')}>{item.endereco}</EditedCell>
                  </div>
                </TableCell>
                <TableCell className={cn('text-center', editedCols.has('quantidade') && 'bg-amber-500/5')}>
                  <Badge variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1 tabular-nums">
                    {item.quantidade ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className={cn('text-center font-mono font-bold text-foreground/80', editedCols.has('quantidade_cx') && 'bg-amber-500/5')}>
                  {item.quantidadeCx ?? '—'}
                </TableCell>
                <TableCell className={cn('text-center font-mono text-muted-foreground text-xs', editedCols.has('caixa_num') && 'bg-amber-500/5')}>
                  {item.caixaNum ? (
                    <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-muted/30">
                      <Hash className="w-3 h-3 text-muted-foreground/50" />
                      <span className="font-bold">{item.caixaNum}</span>
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell className={cn('max-w-[200px]', editedCols.has('observacao') && 'bg-amber-500/5')}>
                  {item.observacao ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help text-muted-foreground/80 hover:text-foreground transition-colors">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                          <span className="truncate text-xs font-medium">{item.observacao}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs font-medium bg-popover shadow-lg border-border">
                        {item.observacao}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground/30 text-[10px]">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold text-primary px-6 tabular-nums">
                  {calculateTotal(item.quantidade, item.quantidadeCx).toLocaleString('pt-BR')}
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
                        <div className="font-semibold">{item.updatedByName || 'Usuário'}</div>
                        <div className="text-muted-foreground">
                          alterou <span className="font-medium text-foreground">{fieldLabel(lf) || '—'}</span>
                        </div>
                        <div className="text-muted-foreground mt-1">
                          {item.lastEditedAt ? new Date(item.lastEditedAt).toLocaleString('pt-BR') : ''}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground/30 text-[10px]">—</span>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label="Editar reserva"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setItemToDelete(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover item</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[400px] max-h-[90vh] overflow-y-auto">
                        <AlertDialogHeader>
                          <div className="flex items-center gap-3 text-destructive mb-2">
                            <div className="p-2 bg-destructive/10 rounded-full">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          </div>
                          <AlertDialogDescription className="text-sm">
                            Você está prestes a remover o item <span className="font-mono font-bold text-foreground tabular-nums">{item.codigo}</span>.
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                          <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                          >
                            Confirmar Exclusão
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );})
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export const MemoizedReservasTable = memo(ReservasTable);
export { ReservasTable };
