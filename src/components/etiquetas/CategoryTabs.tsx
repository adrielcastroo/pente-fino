import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { CategoriaEtiqueta } from '@/types/etiquetas';

export type CategoriaFiltro = 'todas' | CategoriaEtiqueta;

interface CategoryTabsProps {
  value: CategoriaFiltro;
  onChange: (v: CategoriaFiltro) => void;
  counts?: Partial<Record<CategoriaFiltro, number>>;
}

const TABS: { key: CategoriaFiltro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'expedicao', label: 'Expedição' },
  { key: 'conferencia', label: 'Conferência' },
  { key: 'devolucao', label: 'Devolução' },
  { key: 'custom', label: 'Personalizadas' },
];

export const CategoryTabs = memo(function CategoryTabs({ value, onChange, counts }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((t) => {
        const active = t.key === value;
        const count = counts?.[t.key];
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {count !== undefined && (
              <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
});
CategoryTabs.displayName = 'CategoryTabs';
