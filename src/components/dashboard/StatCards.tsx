import React, { useMemo, memo } from 'react';
import { ChevronRight, LucideIcon, BarChart3, Layers3, Users } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tab: string;
  onClick: (tab: any) => void;
}

export const StatCard = memo(({ label, value, icon: Icon, tab, onClick }: StatCardProps) => (
  <button 
    onClick={() => onClick(tab)} 
    className="group cursor-pointer rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] relative text-left w-full"
    role="button"
  >
    <div className="p-5 sm:p-6 flex flex-row items-center gap-4 relative z-10">
      <div className="p-3 rounded-xl bg-primary/8 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-foreground group-hover:text-primary transition-colors">{value}</div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/50 transition-colors" />
    </div>
  </button>
));

StatCard.displayName = 'StatCard';

const iconMap: Record<string, LucideIcon> = { BarChart3, Layers3, Users };

export const StatCards = memo(({ stats, onStatClick }: { stats: any, onStatClick: (tab: any) => void }) => {
  const cards = useMemo(() => [
    { label: 'Conferências', value: stats.totalConferencias, icon: 'BarChart3', tab: 'history' },
    { label: 'Reservas', value: stats.totalRegistros, icon: 'Layers3', tab: 'reservas' },
    { label: 'Conferentes', value: stats.totalConferentes, icon: 'Users', tab: 'inicio' },
  ], [stats.totalConferencias, stats.totalRegistros, stats.totalConferentes]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {cards.map(s => (
        <StatCard 
          key={s.label} 
          label={s.label} 
          value={s.value} 
          icon={iconMap[s.icon]} 
          tab={s.tab} 
          onClick={onStatClick} 
        />
      ))}
    </div>
  );
});

StatCards.displayName = 'StatCards';