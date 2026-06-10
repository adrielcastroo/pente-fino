import React, { useMemo, memo } from 'react';
import { ChevronRight, LucideIcon, BarChart3, Layers3, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  delay?: number;
  onClick: (id: string) => void;
}

export const StatCard = memo(({ id, label, value, icon: Icon, delay = 0, onClick }: StatCardProps) => (
  <motion.button 
    key={id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: delay * 0.1 }}
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(id)} 
    className="group relative cursor-pointer rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-border/20 bg-card/60 backdrop-blur-xl p-4 sm:p-6 lg:p-10 text-left transition-all duration-300 hover:border-primary/40 hover:bg-card/90 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] overflow-hidden shadow-sm flex flex-col justify-between min-h-[8rem] sm:min-h-[10rem] lg:min-h-[12rem]"
    role="button"
  >
    <div className="flex items-center justify-between mb-4 sm:mb-8 relative z-10">
      <div className="p-2.5 sm:p-4 rounded-[1rem] sm:rounded-[1.25rem] bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
        <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-tighter">Detalhes</span>
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
      </div>
    </div>
    
    <div className="space-y-2 sm:space-y-3 relative z-10">
      <div className="text-[clamp(1.75rem,8vw,3.5rem)] font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-500 leading-none">
        {value}
      </div>
      <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-foreground/60 group-hover:text-primary transition-colors duration-500 leading-relaxed">
        {label}
      </p>
    </div>
    
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
  </motion.button>
));

StatCard.displayName = 'StatCard';

const iconMap: Record<string, LucideIcon> = { BarChart3, Layers3, Users };

export const StatCards = memo(({ stats, onStatClick }: { stats: any, onStatClick: (id: string) => void }) => {
  const cards = useMemo(() => [
    { id: 'conferentes', label: 'Conferentes', value: stats.totalConferentes, icon: 'Users', delay: 1 },
    { id: 'conferences', label: 'Conferências', value: stats.totalConferencias, icon: 'BarChart3', delay: 2 },
    { id: 'registros', label: 'Registros', value: stats.totalRegistros, icon: 'Layers3', delay: 3 },
  ], [stats.totalConferencias, stats.totalRegistros, stats.totalConferentes]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 pt-4 sm:pt-10 relative z-10 w-full">
      {cards.map((s, idx) => (
        <StatCard 
          key={s.id} 
          id={s.id}
          label={s.label} 
          value={s.value} 
          icon={iconMap[s.icon]} 
          delay={s.delay}
          onClick={onStatClick} 
          className={idx === 2 ? "col-span-2 lg:col-span-1" : ""}
        />
      ))}
    </div>
  );
});

StatCards.displayName = 'StatCards';
