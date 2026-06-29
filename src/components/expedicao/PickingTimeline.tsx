import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS: { key: string; label: string }[] = [
  { key: 'aguardando', label: 'Criado' },
  { key: 'em_separacao', label: 'Separando' },
  { key: 'em_conferencia', label: 'Conferindo' },
  { key: 'conferido', label: 'Conferido' },
  { key: 'faturado', label: 'Faturado' },
];

interface PickingTimelineProps {
  status: string;
  className?: string;
}

export function PickingTimeline({ status, className }: PickingTimelineProps) {
  if (status === 'cancelado') {
    return (
      <span className="inline-flex items-center rounded-md bg-destructive/15 text-destructive px-2 py-0.5 text-xs font-medium">
        cancelado
      </span>
    );
  }
  const current = Math.max(0, STEPS.findIndex((s) => s.key === status));
  return (
    <ol className={cn('flex items-center gap-1.5', className)}>
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors',
                done && 'border-success bg-success/15 text-success',
                active && 'border-primary bg-primary text-primary-foreground ring-2 ring-primary/20',
                !done && !active && 'border-border bg-muted text-muted-foreground',
              )}
              aria-label={step.label}
              title={step.label}
            >
              {done ? <Check className="size-3" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'h-px w-4 transition-colors',
                  done ? 'bg-success' : 'bg-border',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
