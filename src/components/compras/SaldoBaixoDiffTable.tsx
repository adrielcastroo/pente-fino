import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DIFF_LABELS, type DiffRow } from '@/lib/compras/saldoBaixoDiff';

export interface SaldoBaixoDiffTableProps {
  columns: string[];
  rows: DiffRow[];
  emptyLabel?: string;
}

const STATUS_STYLES: Record<DiffRow['status'], string> = {
  novo: 'bg-primary/15 text-primary border-primary/30',
  alterado: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  removido: 'bg-destructive/15 text-destructive border-destructive/30',
  igual: 'bg-muted text-muted-foreground border-border',
};

/** Tabela da comparação diária, com destaque nas células que mudaram. */
export const SaldoBaixoDiffTable = memo(function SaldoBaixoDiffTable({
  columns,
  rows,
  emptyLabel = 'Nenhum item nesta situação.',
}: SaldoBaixoDiffTableProps) {
  if (!rows.length) {
    return <div className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border border-border">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-28 text-[11px]">Situação</TableHead>
            {columns.map((c, i) => (
              <TableHead key={`${c}-${i}`} className="whitespace-nowrap text-[11px]">
                <span className="text-[9px] text-muted-foreground mr-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((d, ri) => (
            <TableRow key={`${d.key}-${ri}`} className="hover:bg-muted/40">
              <TableCell>
                <Badge variant="outline" className={cn('text-[10px]', STATUS_STYLES[d.status])}>
                  {DIFF_LABELS[d.status]}
                </Badge>
              </TableCell>
              {columns.map((_, ci) => {
                const mudou = d.alteradas.includes(ci);
                return (
                  <TableCell
                    key={ci}
                    className={cn(
                      'text-[11px] align-top max-w-[420px] break-words',
                      mudou && 'bg-amber-500/10 font-medium',
                    )}
                    title={mudou ? `Antes: ${d.anterior?.[ci] ?? ''}` : undefined}
                  >
                    {d.row?.[ci] ?? ''}
                    {mudou && d.anterior?.[ci] ? (
                      <span className="block text-[10px] text-muted-foreground line-through">
                        {d.anterior[ci]}
                      </span>
                    ) : null}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

export default SaldoBaixoDiffTable;
