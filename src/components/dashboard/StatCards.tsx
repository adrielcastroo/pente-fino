import React, { useMemo, memo } from 'react';

interface StatCardProps {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  onClick: (id: string) => void;
}

export const StatCard = memo(({ id, label, value, subtitle, onClick }: StatCardProps) => (
  <button
    key={id}
    onClick={() => onClick(id)}
    className="group relative cursor-pointer rounded-md border border-slate-200 bg-white dark:bg-card/50 dark:border-border/40 p-5 text-left transition-colors hover:border-primary/40 flex flex-col gap-4 min-h-[120px] h-full"
    role="button"
  >
    {subtitle && (
      <div className="flex justify-end">
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums uppercase tracking-wider">
          {subtitle}
        </span>
      </div>
    )}

    <div className="space-y-1 mt-auto">
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
