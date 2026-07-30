import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface AnaliseCompraTableProps {
  columns: string[];
  rows: string[][];
  /** Colunas usadas nos filtros do preset ativo — destacadas no cabeçalho. */
  destaque?: number[];
  emptyLabel?: string;
}

/**
 * Tabela genérica do resultado da consulta. Mantida "burra" de propósito: a
 * consulta do Auge pode mudar de colunas sem exigir alteração de código.
 */
export const AnaliseCompraTable = memo(function AnaliseCompraTable({
  columns,
  rows,
  destaque = [],
  emptyLabel = 'Nenhum item atende aos filtros.',
}: AnaliseCompraTableProps) {
  if (!rows.length) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border border-border">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-[10px] text-muted-foreground">#</TableHead>
            {columns.map((c, i) => (
              <TableHead
                key={`${c}-${i}`}
                className={cn(
                  'whitespace-nowrap text-[11px]',
                  destaque.includes(i + 1) && 'text-primary font-semibold',
                )}
                title={`Coluna ${String(i + 1).padStart(2, '0')}`}
              >
                <span className="text-[9px] text-muted-foreground mr-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} className="hover:bg-muted/40">
              <TableCell className="text-[10px] text-muted-foreground">{ri + 1}</TableCell>
              {columns.map((_, ci) => (
                <TableCell
                  key={ci}
                  className={cn(
                    'text-[11px] align-top max-w-[420px] break-words',
                    destaque.includes(ci + 1) && 'font-medium',
                  )}
                >
                  {row[ci] ?? ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

export default AnaliseCompraTable;
