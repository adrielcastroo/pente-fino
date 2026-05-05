import { useState, memo } from 'react';
import { Reserva } from '@/types';
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
import { MapPin, Hash, MessageSquare, Package, Trash2, AlertTriangle } from 'lucide-react';
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

interface ReservasTableProps {
  items: Reserva[];
  onDelete: (id: string) => void;
}

/**
 * ReservasTable Component
 * 
 * Optimized for performance using React.memo to prevent re-renders
 * when the parent state (e.g., search query) changes but the items list remains identical.
 */
const ReservasTable = ({ items, onDelete }: ReservasTableProps) => {
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="overflow-x-auto relative">
      <Table>
        <TableHeader className="bg-muted/30 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 px-6">Código</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">Endereço</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Quantidade</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Quantidade CX</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Nº CX</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">OBS</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-right pr-6">Total</TableHead>
            <TableHead className="w-10 py-4 pr-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <Package className="w-12 h-12 opacity-20" aria-hidden="true" />
                  <p className="font-semibold italic text-sm">Nenhum item encontrado na prateleira virtual.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow 
                key={item.id} 
                className="group hover:bg-primary/[0.02] transition-colors border-b border-border/30"
              >
                <TableCell className="font-mono font-black text-primary px-6 py-4">
                  {item.codigo}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary/60" />
                    {item.endereco}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
                    {item.quantidade ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-foreground/80">
                  {item.quantidadeCx ?? '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-muted-foreground text-xs">
                  {item.caixaNum ? (
                    <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-muted/30">
                      <Hash className="w-3 h-3 text-muted-foreground/50" />
                      <span className="font-bold">{item.caixaNum}</span>
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell className="max-w-[200px]">
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
                <TableCell className="text-right font-mono font-black text-primary px-6">
                  {calculateTotal(item.quantidade, item.quantidadeCx).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
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
                    <AlertDialogContent className="max-w-[400px]">
                      <AlertDialogHeader>
                        <div className="flex items-center gap-3 text-destructive mb-2">
                          <div className="p-2 bg-destructive/10 rounded-full">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm">
                          Você está prestes a remover o item <span className="font-mono font-bold text-foreground">{item.codigo}</span>. 
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export const MemoizedReservasTable = memo(ReservasTable);
export { ReservasTable };

