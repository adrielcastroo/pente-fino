import React from 'react';
import type { LucideIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  compact?: boolean;
}

/**
 * Empty state padronizado. Usar sempre que uma lista, tabela ou painel
 * estiver sem dados — garante consistência visual em todo o app.
 */
export const EmptyState = React.memo(({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center gap-3',
      compact ? 'py-6' : 'py-12 px-6',
      className,
    )}
    role="status"
    aria-live="polite"
  >
    {Icon && (
      <div className="rounded-md bg-muted/40 p-3 text-muted-foreground/60">
        <Icon className={cn(compact ? 'w-5 h-5' : 'w-6 h-6')} strokeWidth={1.5} />
      </div>
    )}
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {action && (
      <Button
        size="sm"
        variant="outline"
        onClick={action.onClick}
        className="mt-2 rounded-md"
      >
        {action.label}
      </Button>
    )}
  </div>
));

EmptyState.displayName = 'EmptyState';
