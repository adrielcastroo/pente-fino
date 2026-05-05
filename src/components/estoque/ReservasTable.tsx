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
import { MapPin, Hash, MessageSquare, Package } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ReservasTableProps {
  items: Reserva[];
}

export function ReservasTable({ items }: ReservasTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/20">
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">Código</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">Endereço</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Quantidade</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Quantidade CX</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Nº CX</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">OBS</TableHead>
            <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Package className="w-12 h-12 opacity-10" />
                  <p className="font-medium italic">Nenhum item encontrado na prateleira virtual.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors border-b border-border/30">
                <TableCell className="font-mono font-bold text-primary">{item.codigo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {item.endereco}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
                    {item.quantidade ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-foreground">
                  {item.quantidadeCx ?? '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-muted-foreground">
                  {item.caixaNum ? (
                    <div className="flex items-center justify-center gap-1">
                      <Hash className="w-3 h-3" />
                      {item.caixaNum}
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-muted-foreground/70 text-xs">
                  {item.observacao ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-help">
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.observacao}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs font-medium">
                        {item.observacao}
                      </TooltipContent>
                    </Tooltip>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-primary">
                  {calculateTotal(item.quantidade, item.quantidadeCx)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
