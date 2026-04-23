import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, ArrowUpRight, Activity, Calendar, Clock, BarChart3, Users, Layers3, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadialBarChart, 
  RadialBar, 
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Cell
} from 'recharts';

interface StatDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string | number;
  type: 'total' | 'ocupado' | 'reservado' | 'bloqueado' | 'livre' | string;
  data?: any[];
  stats?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down';
    percent?: number;
  }[];
  complementaryInfo?: string;
}

export const StatDetailModal = ({ 
  isOpen, 
  onClose, 
  title, 
  value, 
  type, 
  data = [], 
  stats = [],
  complementaryInfo 
}: StatDetailModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!mounted) return null;

  // Determine colors based on type
  const getTypeColors = () => {
    switch (type.toLowerCase()) {
      case 'ocupado': return { primary: 'text-primary', bg: 'bg-primary/10', chart: 'hsl(var(--primary))' };
      case 'ocupacao': return { primary: 'text-cyan-400', bg: 'bg-cyan-500/10', chart: '#22d3ee' };
      case 'lamina': return { primary: 'text-emerald-400', bg: 'bg-emerald-500/10', chart: '#34d399' };
      case 'base': return { primary: 'text-violet-400', bg: 'bg-violet-500/10', chart: '#a78bfa' };
      case 'avarias': return { primary: 'text-red-400', bg: 'bg-red-500/10', chart: '#f87171' };
      case 'reservado': return { primary: 'text-amber-500', bg: 'bg-amber-500/10', chart: '#f59e0b' };
      case 'bloqueado': return { primary: 'text-destructive', bg: 'bg-destructive/10', chart: 'hsl(var(--destructive))' };
      case 'livre': return { primary: 'text-emerald-500', bg: 'bg-emerald-500/10', chart: '#10b981' };
      default: return { primary: 'text-primary', bg: 'bg-primary/10', chart: 'hsl(var(--primary))' };
    }
  };

  const colors = getTypeColors();
  
  // Example radial data if none provided
  const radialData = [
    { name: 'Value', value: typeof value === 'number' ? value : 75, fill: colors.chart }
  ];

  const getIcon = () => {
    switch (type.toLowerCase()) {
      case 'total': return <BarChart3 className="w-5 h-5" />;
      case 'ocupado': return <Layers3 className="w-5 h-5" />;
      case 'reservado': return <Clock className="w-5 h-5" />;
      case 'bloqueado': return <AlertTriangle className="w-5 h-5" />;
      case 'livre': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-lg bg-card border border-border/40 shadow-2xl rounded-[2.5rem] overflow-hidden z-10"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-muted/30 hover:bg-muted/50 text-muted-foreground transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 sm:p-10 space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${colors.bg} ${colors.primary}`}>
                  {getIcon()}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase text-muted-foreground/50 text-[10px] tracking-[0.2em]">Estatística Detalhada</h3>
                  <h2 className="text-2xl font-black tracking-tight">{title}</h2>
                </div>
              </div>

              {/* Main Content: Radial Chart + Value */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="relative w-48 h-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      innerRadius="80%" 
                      outerRadius="100%" 
                      data={radialData} 
                      startAngle={90} 
                      endAngle={450}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background={{ fill: 'hsl(var(--muted-foreground) / 0.1)' }}
                        dataKey="value"
                        cornerRadius={30}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-black tabular-nums tracking-tighter">{value}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 w-full">
                  {stats.map((s, i) => (
                    <div key={i} className="bg-muted/20 rounded-2xl p-4 border border-border/10 flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                        <p className="text-xl font-black mt-0.5">{s.value}</p>
                      </div>
                      {s.percent !== undefined && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs ${s.trend === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-primary bg-primary/10'}`}>
                          {s.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {s.percent}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Complementary Charts/Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 rounded-2xl p-5 border border-border/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Capacidade</h4>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black">1.2k</span>
                    <span className="text-[10px] font-bold text-muted-foreground mb-1">UNIDADES</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      className={`h-full ${colors.bg} ${colors.primary} bg-current`}
                    />
                  </div>
                </div>

                <div className="bg-muted/10 rounded-2xl p-5 border border-border/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Crescimento</h4>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-emerald-500">+12%</span>
                    <span className="text-[10px] font-bold text-muted-foreground mb-1">ESTE MÊS</span>
                  </div>
                  <div className="flex gap-1 items-end h-8">
                    {[40, 70, 45, 90, 65, 85].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="flex-1 bg-emerald-500/20 rounded-t-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              {complementaryInfo && (
                <div className="pt-4 border-t border-border/10 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted/30 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {complementaryInfo}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
