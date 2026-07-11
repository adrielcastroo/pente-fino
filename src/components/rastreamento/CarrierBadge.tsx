import { memo } from 'react';
import { cn } from '@/lib/utils';
import { carriers } from '@/lib/carriers';

interface CarrierBadgeProps {
  carrierCode: string;
  className?: string;
  showLabel?: boolean;
}

export const CarrierBadge = memo(function CarrierBadge({ carrierCode, className, showLabel = true }: CarrierBadgeProps) {
  const carrier = carriers.find((c) => c.code === carrierCode);
  if (!carrier) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground', className)}>
        {showLabel ? carrierCode : null}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
        carrier.color,
        className,
      )}
    >
      {showLabel && <span>{carrier.name}</span>}
    </span>
  );
});

CarrierBadge.displayName = 'CarrierBadge';
