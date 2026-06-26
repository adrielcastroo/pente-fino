import type { ComponentType, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatVariant = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'muted';

const VARIANT: Record<StatVariant, { border: string; bg: string; color: string }> = {
  default:     { border: 'border-border',        bg: 'bg-card',                 color: 'text-foreground' },
  primary:     { border: 'border-primary/30',    bg: 'bg-primary/5',            color: 'text-primary' },
  success:     { border: 'border-success/30',    bg: 'bg-success/5',            color: 'text-success' },
  warning:     { border: 'border-warning/30',    bg: 'bg-warning/5',            color: 'text-warning' },
  destructive: { border: 'border-destructive/30',bg: 'bg-destructive/5',        color: 'text-destructive' },
  muted:       { border: 'border-border',        bg: 'bg-muted/30',             color: 'text-muted-foreground' },
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  variant?: StatVariant;
  icon?: ComponentType<{ className?: string }>;
  hint?: ReactNode;
  className?: string;
}

/**
 * Card de KPI no padrão visual do módulo Estoque.
 */
export function StatCard({
  label,
  value,
  variant = 'default',
  icon: Icon,
  hint,
  className,
}: StatCardProps) {
  const v = VARIANT[variant];
  return (
    <Card
      className={cn(
        'rounded-[1.5rem] sm:rounded-[2rem] border-2 backdrop-blur-xl transition-all duration-300 relative overflow-hidden group',
        v.border,
        v.bg,
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent pointer-events-none" />
      <CardContent className="p-4 sm:p-6 tablet-portrait:p-2 text-center space-y-1 sm:space-y-2 tablet-portrait:space-y-0.5 relative z-10">
        {Icon && (
          <Icon className={cn('w-4 h-4 mx-auto opacity-70', v.color)} />
        )}
        <div
          className={cn(
            'text-xl sm:text-2xl lg:text-3xl tablet-portrait:text-lg font-semibold tabular-nums tracking-tighter drop-shadow-sm',
            v.color,
          )}
        >
          {value}
        </div>
        <div className="text-[9px] tablet-portrait:text-[8px] font-semibold text-muted-foreground uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
          {label}
        </div>
        {hint && <div className="text-[10px] text-muted-foreground/80 pt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export default StatCard;
