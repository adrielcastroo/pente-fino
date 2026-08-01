
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/hooks/use-presence";

export function PresenceIndicator({ status, className }: { status: PresenceStatus | 'offline', className?: string }) {
  const colors = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-500',
  };

  const labels = {
    online: 'Online',
    away: 'Ausente',
    offline: 'Offline',
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className={cn("w-2 h-2 rounded-full", colors[status])} />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {labels[status]}
      </span>
    </div>
  );
}
