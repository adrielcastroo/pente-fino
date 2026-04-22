import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RAL_COLORS, findRalByHex, type RalColor } from '@/lib/ral-colors';
import { cn } from '@/lib/utils';

interface Props {
  value: string;       // hex
  onChange: (hex: string, ral?: RalColor) => void;
  className?: string;
}

const FAMILIES = ['Todos', 'Branco', 'Bege', 'Marrom', 'Cinza', 'Preto', 'Amarelo', 'Laranja', 'Vermelho', 'Rosa', 'Violeta', 'Azul', 'Verde'] as const;

export function RalColorPicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<typeof FAMILIES[number]>('Todos');

  const current = findRalByHex(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RAL_COLORS.filter(r => {
      if (family !== 'Todos' && r.family !== family) return false;
      if (!q) return true;
      return (
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.hex.toLowerCase().includes(q)
      );
    });
  }, [query, family]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 h-10 px-3 rounded-md border border-border/50 bg-background hover:border-primary/40 transition w-full text-left',
            className,
          )}
        >
          <span
            className="w-6 h-6 rounded-md border border-border/40 shrink-0"
            style={{ backgroundColor: value }}
          />
          <div className="flex-1 min-w-0">
            {current ? (
              <>
                <div className="text-xs font-bold truncate">{current.code}</div>
                <div className="text-[10px] text-muted-foreground truncate">{current.name}</div>
              </>
            ) : (
              <div className="text-xs font-mono text-muted-foreground">{value.toUpperCase()}</div>
            )}
          </div>
          <Badge variant="outline" className="text-[9px] shrink-0">RAL</Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="p-3 border-b border-border/30 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="RAL 9010, branco..."
              className="pl-8 h-9 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {FAMILIES.map(f => (
              <button
                key={f}
                onClick={() => setFamily(f)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded border font-semibold transition',
                  family === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 grid grid-cols-4 gap-1.5">
          {filtered.map(r => {
            const selected = r.hex.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={r.code}
                onClick={() => { onChange(r.hex, r); setOpen(false); }}
                title={`${r.code} — ${r.name}`}
                className={cn(
                  'group relative aspect-square rounded-md border-2 transition hover:scale-105',
                  selected ? 'border-primary ring-2 ring-primary/30' : 'border-border/30 hover:border-primary/50'
                )}
                style={{ backgroundColor: r.hex }}
              >
                {selected && (
                  <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
                )}
                <span className="absolute inset-x-0 bottom-0 text-[7px] font-black text-white bg-black/40 py-0.5 rounded-b-md backdrop-blur-sm leading-none truncate px-0.5">
                  {r.code.replace('RAL ', '')}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-4 text-center text-xs text-muted-foreground py-6">Nenhuma cor encontrada</div>
          )}
        </div>
        <div className="p-2 border-t border-border/30 flex items-center gap-2 bg-muted/20">
          <span className="text-[10px] text-muted-foreground font-semibold">Personalizada:</span>
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="h-7 w-10 rounded border border-border/40 cursor-pointer bg-transparent"
          />
          <Button size="sm" variant="ghost" className="h-7 text-[10px] ml-auto" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default RalColorPicker;
