import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, X } from 'lucide-react';
import { TableCell } from './TableCell';

interface TableRowProps {
  r: any;
  i: number;
  columns: any[];
  searchQuery: string;
  onStartEdit: (rowId: string, key: string, val: string) => void;
  onDelete: (id: string) => void;
  onCopy: (t: string) => void;
  isLow: boolean;
  editingCell: { rowId: string; key: string } | null;
  editValue: string;
  onEditValueChange: (val: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
}

export const TableRow = memo(({ r, i, columns, searchQuery, onStartEdit, onDelete, onCopy, isLow, editingCell, editValue, onEditValueChange, onCommitEdit, onCancelEdit }: TableRowProps) => {
  return (
    <tr className={`group hover:bg-muted/40 border-b border-border/40 ${r.isNew ? 'bg-primary/5' : ''}`}>
      <td className="px-2 sm:px-4 py-2 sm:py-3.5 text-[10px] sm:text-xs text-muted-foreground/50 font-black tabular-nums">{i + 1}</td>
      {columns.map((column: any) => (
        <TableCell
          key={column.key}
          r={r}
          column={column}
          searchQuery={searchQuery}
          isEditing={editingCell?.rowId === r.id && editingCell?.key === column.key}
          editValue={editValue}
          onEditValueChange={onEditValueChange}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
          onStartEdit={onStartEdit}
          onCopy={onCopy}
        />
      ))}
      <td className="px-2 sm:px-4 py-2 sm:py-3.5">
        <div className={`flex justify-end gap-1.5 transition-opacity ${isLow ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {!isLow && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onCopy(r.loteSistema)} 
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" 
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Copiar Lote Sistema</TooltipContent>
            </Tooltip>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(r.id)} 
            className={`h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors ${isLow ? 'text-destructive/50' : ''}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

TableRow.displayName = 'TableRow';
