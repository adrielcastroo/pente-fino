import { cn } from '@/lib/utils';
import type { PickingStatus } from '@/hooks/expedicao/useExpedicaoData';

const STATUS_MAP: Record<PickingStatus, { label: string; cls: string }> = {
  aguardando:     { label: 'Aguardando',     cls: 'bg-muted text-muted-foreground' },
  em_separacao:   { label: 'Em separação',   cls: 'bg-warning/15 text-warning' },
  em_conferencia: { label: 'Em conferência', cls: 'bg-primary/15 text-primary' },
  conferido:      { label: 'Conferido',      cls: 'bg-primary/10 text-primary' },
  faturado:       { label: 'Faturado',       cls: 'bg-success/15 text-success' },
  cancelado:      { label: 'Cancelado',      cls: 'bg-destructive/15 text-destructive' },
};

export interface StatusBadgeProps {
  status: PickingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status];
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        cfg.cls,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}

export default StatusBadge;
