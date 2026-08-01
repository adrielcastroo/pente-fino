import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginacaoProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

/**
 * Barra de paginação padrão. Renderiza apenas o intervalo visível,
 * evitando montar centenas de linhas de uma só vez.
 */
export default function Paginacao({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginacaoProps) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (currentPage - 1) * pageSize;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <div className="text-xs text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{startIdx + 1}</span>–
        <span className="font-medium text-foreground">{Math.min(startIdx + pageSize, total)}</span> de{' '}
        <span className="font-medium text-foreground">{total}</span>
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Por página</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-9 w-[80px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onPageChange(1)} disabled={currentPage === 1} title="Primeira">
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} title="Anterior">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs px-2 whitespace-nowrap">
            Página <span className="font-medium text-foreground">{currentPage}</span> / {totalPages}
          </span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} title="Próxima">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} title="Última">
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
