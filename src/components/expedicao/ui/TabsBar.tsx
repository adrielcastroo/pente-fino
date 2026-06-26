import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

export interface TabsBarItem<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface TabsBarProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  items: TabsBarItem<T>[];
  className?: string;
}

/**
 * Barra de abas padrão do módulo Expedição, espelhada no módulo Estoque.
 */
export function TabsBar<T extends string>({
  value,
  onValueChange,
  items,
  className,
}: TabsBarProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex bg-card/40 backdrop-blur rounded-lg p-1 gap-1 border border-border/30 w-full sm:max-w-md',
        className,
      )}
    >
      {items.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(v)}
            className={cn(
              'flex-1 py-2.5 rounded-md text-[10px] sm:text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 min-w-0',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default TabsBar;
