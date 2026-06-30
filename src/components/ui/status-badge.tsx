import { cn } from '@/lib/utils';

/**
 * Mapa de tons por status. Extensível: qualquer string é aceita,
 * estilos padrão cobrem os status conhecidos do app.
 */
export type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'primary';

const TONE_CLS: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info:    'bg-primary/10 text-primary',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger:  'bg-destructive/15 text-destructive',
};

export interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        TONE_CLS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
