import React, { useMemo, memo } from 'react';
import { ChevronRight, LucideIcon, BarChart3, Layers3, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  delay?: number;
  onClick: (id: string) => void;
}

export const StatCard = memo(({ id, label, value, subtitle, icon: Icon, delay = 0, onClick }: StatCardProps) => (
  <motion.button 
    key={id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: delay * 0.1, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -8, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(id)} 
    className="group relative cursor-pointer rounded-[2rem] border border-border/10 bg-card/40 backdrop-blur-xl p-6 sm:p-8 text-left transition-all duration-500 hover:border-primary/40 hover:bg-card/70 hover:shadow-[0_30px_60px_-15px_rgba(var(--primary-rgb),0.15)] overflow-hidden shadow-sm flex flex-col justify-between min-h-[9rem] sm:min-h-[12rem]"
    role="button"
  >
    <div className="flex items-center justify-between mb-6 sm:mb-10 relative z-10">
      <div className="p-3 sm:p-5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-primary/5">
        <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
      </div>
      {subtitle && (
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 px-2.5 py-1 rounded-full border border-border/20 bg-muted/20">
          {subtitle}
        </span>
      )}
    </div>
    
    <div className="space-y-2 sm:space-y-4 relative z-10">
      <div className="text-[clamp(2.25rem,10vw,4.5rem)] font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-500 leading-none">
        {value}
      </div>
      <p className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-foreground/40 group-hover:text-primary/60 transition-colors duration-500 leading-relaxed">
        {label}
      </p>
    </div>
    
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
  </motion.button>
));

StatCard.displayName = 'StatCard';

const iconMap: Record<string, LucideIcon> = { BarChart3, Layers3, Users };

export const StatCards = memo(({ stats, onStatClick }: { stats: any, onStatClick: (id: string) => void }) => {
  const cards = useMemo(() => [
    { id: 'conferentes', label: 'Conferentes', value: stats.totalConferentes, subtitle: 'Acumulado', icon: 'Users', delay: 1 },
    { id: 'conferences', label: 'Sessões de Conferência', value: stats.totalConferencias, subtitle: 'Total no histórico', icon: 'BarChart3', delay: 2 },
    { id: 'registros', label: 'Registros', value: stats.totalRegistros, subtitle: 'Total no histórico', icon: 'Layers3', delay: 3 },
  ], [stats.totalConferencias, stats.totalRegistros, stats.totalConferentes]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 pt-6 sm:pt-10 relative z-10 w-full overflow-hidden">
      {cards.map((s) => (
        <StatCard 
          key={s.id} 
          id={s.id}
          label={s.label} 
          value={s.value} 
          subtitle={s.subtitle}
          icon={iconMap[s.icon]} 
          delay={s.delay}
          onClick={onStatClick} 
        />
      ))}
    </div>
  );
});

StatCards.displayName = 'StatCards';
