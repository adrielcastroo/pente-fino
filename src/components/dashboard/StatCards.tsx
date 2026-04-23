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
    className="group cursor-pointer rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.98] relative text-left w-full"
    role="button"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="p-6 sm:p-7 flex flex-row items-center gap-5 relative z-10">
      <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-3xl sm:text-4xl font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors">
          {value}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 mt-1 flex items-center gap-2">
          {label}
          <span className="w-1 h-1 rounded-full bg-primary/30" />
        </p>
      </div>
      <div className="h-8 w-8 rounded-full border border-border/50 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
    </div>
  </button>
));

StatCard.displayName = 'StatCard';

const iconMap: Record<string, LucideIcon> = { BarChart3, Layers3, Users };

export const StatCards = memo(({ stats, onStatClick }: { stats: any, onStatClick: (tab: any) => void }) => {
  const cards = useMemo(() => [
    { label: 'Conferências', value: stats.totalConferencias, icon: 'BarChart3', tab: 'history' },
    { label: 'Registros', value: stats.totalRegistros, icon: 'Layers3', tab: 'table' },
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