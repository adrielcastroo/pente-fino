import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
}

/**
 * Combobox com criação livre.
 * - Mostra sugestões (options) filtradas pela busca
 * - Se o valor digitado não existir na lista, exibe "Criar '<valor>'"
 */
export function ComboboxCreatable({
  value, onChange, options, placeholder = 'Selecione…',
  emptyLabel = 'Nenhum resultado', className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const o of options) {
      const key = o.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(o.trim());
    }
    return out.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [options]);

  const q = query.trim();
  const exists = uniqueOptions.some(o => o.toLowerCase() === q.toLowerCase());

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar ou digitar novo…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {q ? (
                <button
                  type="button"
                  onClick={() => commit(q)}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                >
                  <Plus className="h-4 w-4" /> Criar "<span className="font-medium">{q}</span>"
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">{emptyLabel}</span>
              )}
            </CommandEmpty>
            {uniqueOptions.length > 0 && (
              <CommandGroup heading="Sugestões">
                {uniqueOptions.map(o => (
                  <CommandItem key={o} value={o} onSelect={() => commit(o)}>
                    <Check className={cn('mr-2 h-4 w-4', value === o ? 'opacity-100' : 'opacity-0')} />
                    {o}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {q && !exists && uniqueOptions.length > 0 && (
              <CommandGroup heading="Novo">
                <CommandItem value={`__create_${q}`} onSelect={() => commit(q)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar "<span className="font-medium ml-1">{q}</span>"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
