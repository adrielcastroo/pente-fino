import { memo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, CheckCircle2, Clock, AlertCircle, Truck, Package } from 'lucide-react';
import type { TrackingEvent, TrackingStatus } from '@/types/tracking';
import { CarrierBadge } from './CarrierBadge';

const STATUS_CONFIG: Record<TrackingStatus, { label: string; color: string; dot: string; Icon: typeof Clock }> = {
  pendente:    { label: 'Pendente',    color: 'text-slate-500',    dot: 'bg-slate-400',    Icon: Clock },
  pagamento:   { label: 'Pagamento',   color: 'text-blue-600',     dot: 'bg-blue-500',     Icon: Package },
  preparacao:  { label: 'Preparação',  color: 'text-purple-600',   dot: 'bg-purple-500',   Icon: Package },
  despachado:  { label: 'Despachado',  color: 'text-orange-600',   dot: 'bg-orange-500',   Icon: Truck },
  em_transito: { label: 'Em Trânsito', color: 'text-emerald-600',  dot: 'bg-emerald-500',  Icon: Truck },
  entregue:    { label: 'Entregue',    color: 'text-emerald-700',  dot: 'bg-emerald-600',  Icon: CheckCircle2 },
  erro:        { label: 'Erro',        color: 'text-red-600',      dot: 'bg-red-500',      Icon: AlertCircle },
  devolvido:   { label: 'Devolvido',   color: 'text-amber-600',    dot: 'bg-amber-500',    Icon: Truck },
};

interface RastreamentoTimelineProps {
  events: TrackingEvent[];
  currentStatus?: TrackingStatus;
  carrierCode?: string;
}

export const RastreamentoTimeline = memo(function RastreamentoTimeline({ events, currentStatus, carrierCode }: RastreamentoTimelineProps) {
  if (!events.length) return <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento encontrado</p>;

  return (
    <div className="relative">
      {carrierCode && <CarrierBadge carrierCode={carrierCode} className="mb-3" />}
      <div className="space-y-4">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1;
          const config = STATUS_CONFIG[event.status] || STATUS_CONFIG.pendente;
          const Icon = config.Icon;
          const isCurrent = currentStatus === event.status && isLast;

          return (
            <div key={`${event.timestamp}-${idx}`} className="flex gap-3 relative">
              <div className="relative flex items-start flex-col">
                <div className={cn('w-3 h-3 rounded-full flex-shrink-0 z-10 mt-1.5', config.dot, isCurrent && 'ring-2 ring-primary/40')} />
                {!isLast && <div className="w-0.5 flex-1 bg-border ml-[5px] mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <span className={cn('font-medium text-sm', isCurrent && 'text-primary')}>{config.label}</span>
                  {isCurrent && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded uppercase">Atual</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                {event.location && (
                  <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {event.location}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

RastreamentoTimeline.displayName = 'RastreamentoTimeline';
