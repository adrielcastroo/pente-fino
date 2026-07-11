import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { TrackingStatus } from '@/types/tracking';

const STEPS: { status: TrackingStatus; label: string; short: string }[] = [
  { status: 'pagamento',   label: 'Pagamento',   short: 'PAG' },
  { status: 'preparacao',  label: 'Preparação',  short: 'PREP' },
  { status: 'despachado',  label: 'Despachado',  short: 'DESP' },
  { status: 'em_transito', label: 'Em Trânsito', short: 'TRÂN' },
  { status: 'entregue',    label: 'Entregue',    short: 'ENT' },
];

const ORDER: TrackingStatus[] = ['pagamento', 'preparacao', 'despachado', 'em_transito', 'entregue'];

interface RastreamentoProgressProps {
  status: TrackingStatus;
  events?: Array<{ status: TrackingStatus; timestamp: string }>;
}

export const RastreamentoProgress = memo(function RastreamentoProgress({ status }: RastreamentoProgressProps) {
  const currentIndex = ORDER.indexOf(status);
  const isDelivered = status === 'entregue';
  const isError = status === 'erro' || status === 'devolvido';

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex items-center min-w-max gap-1">
        {STEPS.map((step, idx) => {
          const isCompleted = currentIndex >= 0 && idx <= currentIndex;
          const isCurrent = idx === currentIndex && !isDelivered && !isError;
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.status} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all',
                    isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                    isCurrent   ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary/30' :
                                  'bg-muted border-border text-muted-foreground',
                    isError && idx === currentIndex && 'bg-destructive border-destructive text-destructive-foreground',
                  )}
                >
                  {isCompleted && !isCurrent ? '✓' : step.short}
                </div>
                <span className={cn('mt-1.5 text-[11px] font-medium text-center whitespace-nowrap w-20', isCurrent ? 'text-primary' : 'text-muted-foreground')}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className={cn('w-8 h-0.5 mx-0.5 mb-6', idx < currentIndex ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

RastreamentoProgress.displayName = 'RastreamentoProgress';
