import { StatusBadge as BaseStatusBadge, type StatusTone } from '@/components/ui/status-badge';
import type { PickingStatus } from '@/hooks/expedicao/useExpedicaoData';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<PickingStatus, { label: string; tone: StatusTone }> = {
  aguardando:     { label: 'Aguardando',     tone: 'neutral' },
  em_separacao:   { label: 'Em separação',   tone: 'warning' },
  em_conferencia: { label: 'Em conferência', tone: 'primary' },
  conferido:      { label: 'Conferido',      tone: 'info' },
  faturado:       { label: 'Faturado',       tone: 'success' },
  cancelado:      { label: 'Cancelado',      tone: 'danger' },
};

export interface StatusBadgeProps {
  status: PickingStatus;
  className?: string;
}

/** Wrapper específico de Expedição sobre o StatusBadge compartilhado. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status];
  return <BaseStatusBadge label={cfg.label} tone={cfg.tone} className={cn(className)} />;
}

export default StatusBadge;
