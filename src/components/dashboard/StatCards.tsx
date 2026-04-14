import React, { useMemo, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, LucideIcon, BarChart3, Layers3, Users } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tab: string;
  onClick: (tab: any) => void;
}

export const StatCard = memo(({ label, value, icon: Icon, tab, onClick }: StatCardProps) => (
  <Card 
    onClick={() => onClick(tab)} 
    className="group cursor-pointer border border-border/40 bg-card/10 overflow-hidden transition-colors hover:bg-card/30 active:scale-[0.98] relative"
    role="button"
  >
    <CardContent className="p-6 sm:p-8 flex flex-row items-center gap-4 sm:gap-6 relative z-10">
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-4xl font-bold tracking-tight tabular-nums text-foreground group-hover:text-primary transition-colors">{value}</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mt-1">{label}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </CardContent>
  </Card>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
