import { Search, ArrowUpDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { memo } from 'react';

interface TableHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortByChange: (s: string) => void;
  onClearAll: () => void;
  registrosCount: number;
}

export const TableHeader = memo(({ searchQuery, onSearchChange, sortBy, onSortByChange, onClearAll, registrosCount }: TableHeaderProps) => {
  return (
    <div className="px-3 sm:px-6 py-4 bg-card/60 border-b border-border/40 flex flex-col gap-4 flex-shrink-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          <input 
            value={searchQuery} 
            onChange={e => onSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-muted/40 text-sm font-bold tracking-tight focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder:text-muted-foreground/40" 
            placeholder="Buscar material, lote ou endereço..." 
            autoComplete="off" 
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-1 sm:flex-none h-11 px-4 rounded-xl border border-border/50 bg-muted/30 flex items-center gap-2 transition-all hover:bg-muted/50 group">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary" />
            <select 
              value={sortBy} 
              onChange={e => onSortByChange(e.target.value)}
              className="flex-1 sm:flex-none bg-transparent border-none outline-none text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer group-hover:text-foreground"
            >
              <option value="">Ordenar</option>
              <option value="item">A-Z</option>
              <option value="ml-d">Linear ↓</option>
              <option value="ml-a">Linear ↑</option>
              <option value="end">Endereço</option>
            </select>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onClearAll} 
                className="h-11 w-11 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                disabled={registrosCount === 0}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpar Tabela</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});

TableHeader.displayName = 'TableHeader';
