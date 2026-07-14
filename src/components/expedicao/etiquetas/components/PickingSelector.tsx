// ============================================================================
// PickingSelector — autocomplete com auto-fill de variáveis.
// ============================================================================
import { useMemo, useState } from 'react';
import { Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePickings } from '@/hooks/expedicao/useExpedicaoData';
import type { PickingLike } from '../types/etiqueta';

interface Props {
  onSelect: (p: PickingLike) => void;
}

const OPEN_STATUSES = new Set(['em_separacao', 'aguardando', 'em_conferencia']);

export function PickingSelector({ onSelect }: Props) {
  const { data = [], isLoading } = usePickings();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data
      .filter((p) => OPEN_STATUSES.has(p.status))
      .filter((p) => !term || p.numero.toLowerCase().includes(term) || p.cliente.toLowerCase().includes(term))
      .slice(0, 50);
  }, [data, q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Package className="size-4" /> Preencher com picking
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-0">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por número, cliente..."
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
        <ScrollArea className="h-72">
          {isLoading && <p className="text-xs text-muted-foreground p-3">Carregando...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-xs text-muted-foreground p-3 italic">Nenhum picking em aberto.</p>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent border-b border-border/40"
              onClick={() => { onSelect(p); setOpen(false); }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium">{p.numero}</span>
                <Badge variant="outline" className="text-[9px] h-4">{p.status}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{p.cliente}</p>
              {p.nfe_numero && <p className="text-[10px] text-muted-foreground font-mono">NF {p.nfe_numero}</p>}
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default PickingSelector;
