import { StatusBadge as BaseStatusBadge, type StatusTone } from '@/components/ui/status-badge';
import type { PickingStatus } from '@/hooks/expedicao/useExpedicaoData';
import type { Database } from '@/integrations/supabase/types';

import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  aguardando:     { label: 'Aguardando',     tone: 'neutral' },
  em_separacao:   { label: 'Em separação',   tone: 'warning' },
  em_conferencia: { label: 'Em conferência', tone: 'primary' },
  conferido:      { label: 'Conferido',      tone: 'info' },
  faturado:       { label: 'Faturado',       tone: 'success' },
  cancelado:      { label: 'Cancelado',      tone: 'danger' },
  // Estados da peça (expedicao_peca_status)
  etiquetada:     { label: 'Etiquetada',     tone: 'neutral' },
  no_carrinho:    { label: 'No Carrinho',    tone: 'warning' },
  conferida:      { label: 'Conferida',      tone: 'primary' },
  no_romaneio:    { label: 'No Romaneio',    tone: 'info' },
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
