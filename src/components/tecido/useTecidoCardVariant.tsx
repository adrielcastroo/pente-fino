import { useEffect, useState, useCallback } from 'react';
import type { TecidoCardVariant } from './TecidoCardsView';

const STORAGE_KEY = 'tecido:card-variant';
const EVENT = 'tecido:card-variant:change';
const DEFAULT: TecidoCardVariant = 'emphasis';

function read(): TecidoCardVariant {
  if (typeof window === 'undefined') return DEFAULT;
  const v = window.localStorage.getItem(STORAGE_KEY) as TecidoCardVariant | null;
  return v === 'compact' || v === 'emphasis' || v === 'motion' ? v : DEFAULT;
}

export function useTecidoCardVariant(): TecidoCardVariant {
  const [v, setV] = useState<TecidoCardVariant>(() => read());
  useEffect(() => {
    const h = () => setV(read());
    window.addEventListener(EVENT, h);
    window.addEventListener('storage', h);
    return () => {
      window.removeEventListener(EVENT, h);
      window.removeEventListener('storage', h);
    };
  }, []);
  return v;
}

export function useSetTecidoCardVariant() {
  return useCallback((v: TecidoCardVariant) => {
    window.localStorage.setItem(STORAGE_KEY, v);
    window.dispatchEvent(new Event(EVENT));
  }, []);
}

export function TecidoCardVariantSwitcher() {
  const current = useTecidoCardVariant();
  const set = useSetTecidoCardVariant();
  const opts: { id: TecidoCardVariant; label: string; hint: string }[] = [
    { id: 'compact', label: 'Compacto', hint: 'Alta densidade' },
    { id: 'emphasis', label: 'Ênfase', hint: 'Item em destaque' },
    { id: 'motion', label: 'Motion', hint: 'Transições sutis' },
  ];
  return (
    <div className="px-3 pt-3">
      <div
        role="radiogroup"
        aria-label="Variação visual dos cards"
        className="inline-flex items-center gap-1 p-1 rounded-md bg-muted/40 border border-border/60"
      >
        {opts.map(o => {
          const active = o.id === current;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => set(o.id)}
              title={o.hint}
              className={`px-2.5 h-7 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                active
                  ? 'bg-card text-primary shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
