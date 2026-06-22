import React, { useMemo, memo } from 'react';
import { LucideIcon, BarChart3, Layers3, Users } from 'lucide-react';

interface StatCardProps {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  onClick: (id: string) => void;
}

export const StatCard = memo(({ id, label, value, subtitle, icon: Icon, onClick }: StatCardProps) => (
  <button
    key={id}
    onClick={() => onClick(id)}
    className="group relative cursor-pointer rounded-md border border-border/40 bg-card/50 p-5 text-left transition-colors hover:border-primary/40 hover:bg-card/80 flex flex-col gap-4 min-h-[120px] h-full"
    role="button"
  >
    <div className="flex items-center justify-between">
      <div className="p-2 rounded-md bg-primary/10 text-primary">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </div>
      {subtitle && (
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
          {subtitle}
        </span>
      )}
    </div>

    <div className="space-y-1">
      <div className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums text-foreground leading-none">
        {value}
      </div>
      <p className="text-xs font-medium text-muted-foreground leading-tight">
        {label}
      </p>
    </div>
  </button>
));

StatCard.displayName = 'StatCard';

const iconMap: Record<string, LucideIcon> = { BarChart3, Layers3, Users };

export const StatCards = memo(({ stats, onStatClick }: { stats: any, onStatClick: (id: string) => void }) => {
  const cards = useMemo(() => [
    { id: 'conferentes', label: 'Conferentes', value: stats.totalConferentes, subtitle: 'Acumulado', icon: 'Users' },
    { id: 'conferences', label: 'Sessões de conferência', value: stats.totalConferencias, subtitle: 'Acumulado geral', icon: 'BarChart3' },
    { id: 'registros', label: 'Registros', value: stats.totalRegistros, subtitle: 'Acumulado geral', icon: 'Layers3' },
  ], [stats.totalConferencias, stats.totalRegistros, stats.totalConferentes]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full items-stretch">
      {cards.map((s) => (
        <StatCard
          key={s.id}
          id={s.id}
          label={s.label}
          value={s.value}
          subtitle={s.subtitle}
          icon={iconMap[s.icon]}
          onClick={onStatClick}
        />
      ))}
    </div>
  );
});

StatCards.displayName = 'StatCards';
