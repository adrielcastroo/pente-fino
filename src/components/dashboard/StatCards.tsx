import { memo, useMemo } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Users, CalendarDays, FileText } from 'lucide-react';

export interface DashboardStatCardsProps {
  stats: {
    totalConferentes: number;
    totalConferencias: number;
    totalRegistros: number;
  };
  onStatClick: (id: string) => void;
}

interface CardDef {
  id: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}

/**
 * Grid de KPIs do dashboard — usa o StatCard canônico (ui/stat-card.tsx).
 * Mantém a mesma superfície de props do componente anterior para não quebrar o caller.
 */
export const StatCards = memo(({ stats, onStatClick }: DashboardStatCardsProps) => {
  const cards = useMemo<CardDef[]>(() => [
    { id: 'conferentes', label: 'Conferentes', value: stats.totalConferentes, icon: Users, hint: 'Acumulado' },
    { id: 'conferences', label: 'Sessões de conferência', value: stats.totalConferencias, icon: CalendarDays, hint: 'Acumulado geral' },
    { id: 'registros', label: 'Registros', value: stats.totalRegistros, icon: FileText, hint: 'Acumulado geral' },
  ], [stats.totalConferentes, stats.totalConferencias, stats.totalRegistros]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full items-stretch">
      {cards.map((s) => (
        <div key={s.id} onClick={() => onStatClick(s.id)} className="cursor-pointer h-full">
          <StatCard
            label={s.label}
            value={s.value}
            icon={s.icon}
            hint={s.hint}
            className="h-full"
          />
        </div>
      ))}
    </div>
  );
});

StatCards.displayName = 'StatCards';