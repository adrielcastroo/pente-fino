import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Users, Layers3, BarChart3, TrendingUp, Download, Eye, LayoutDashboard, ChevronRight, Activity, Zap } from 'lucide-react';
import { computeStats, exportToExcel } from '@/lib/dashboard-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { motion } from 'framer-motion';

const CHART_COLORS = [
  'hsl(var(--primary))',
  '#06b6d4',
  '#22d3ee',
  '#0ea5e9',
  '#8b5cf6',
  '#a78bfa',
];

export default function DashboardPage() {
  const history = useAppStore(s => s.history);
  const setFormData = useAppStore(s => s.setFormData);
  const stats = useMemo(() => computeStats(history), [history]);
  const [detailChart, setDetailChart] = useState<{ title: string; data: any[]; type: 'pie' | 'bar' } | null>(null);

  const handleStatClick = (tab: any) => {
    setFormData({ activeTab: tab });
  };

  const handleExport = useCallback((data: any[], fileName: string) => {
    exportToExcel(data, fileName);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const item = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const statCards = [
    { label: 'Conferências', value: stats.totalConferencias, icon: BarChart3, tab: 'history', glow: 'shadow-primary/20', accent: 'text-primary', ring: 'ring-primary/30' },
    { label: 'Registros', value: stats.totalRegistros, icon: Layers3, tab: 'table', glow: 'shadow-cyan-500/20', accent: 'text-cyan-400', ring: 'ring-cyan-500/30' },
    { label: 'Conferentes', value: stats.totalConferentes, icon: Users, tab: 'inicio', glow: 'shadow-sky-500/20', accent: 'text-sky-400', ring: 'ring-sky-500/30' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-10 max-w-7xl mx-auto overflow-x-hidden animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.25em] text-[9px] sm:text-[10px]">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Sistema Pente Fino</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-foreground leading-none">
            Painel de <span className="text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]">Controle</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-2.5 py-1 rounded-lg border-primary/30 bg-primary/5 text-primary text-[10px] font-black flex gap-1.5 shadow-lg shadow-primary/10">
            <Activity className="w-3 h-3 animate-pulse" />
            <span className="hidden sm:inline">Sincronizado</span>
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border/40 bg-card/50 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all" onClick={() => handleExport(history, 'Historico_Geral')}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar Histórico</TooltipContent>
          </Tooltip>
        </div>
      </header>
      
      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3 sm:gap-5">
        {statCards.map(s => (
          <motion.div key={s.label} variants={item}>
            <Card 
              onClick={() => handleStatClick(s.tab)} 
              className={`group cursor-pointer border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-primary/40 shadow-xl ${s.glow}`}
              role="button"
              aria-label={`Ver detalhes de ${s.label}`}
            >
              <CardContent className="p-3 sm:p-5 flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-xl bg-primary/5 border border-primary/10 ${s.accent} group-hover:bg-primary/10 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500`}>
                  <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-center sm:text-left">
                  <div className={`text-2xl sm:text-4xl font-black tracking-tighter tabular-nums ${s.accent} drop-shadow-[0_0_8px_currentColor]`}>{s.value}</div>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all ml-auto hidden sm:block" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[
          { title: 'Conferentes', data: stats.topConferentes, type: 'bar' as const, icon: Users, desc: 'Top por volume' },
          { title: 'Categorias', data: stats.categorias, type: 'pie' as const, icon: Layers3, desc: 'Distribuição' },
          { title: 'Ferramentas', data: stats.ferramentas, type: 'bar' as const, icon: BarChart3, desc: 'Frequência de uso' },
          { title: 'Materiais', data: stats.tipos, type: 'pie' as const, icon: TrendingUp, desc: 'Especificações' },
        ].map(chart => (
          <Card key={chart.title} className="group border border-border/30 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 shadow-xl shadow-black/10 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border/20">
              <div className="space-y-0.5 min-w-0">
                <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500 shrink-0">
                    <chart.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{chart.title}</span>
                </CardTitle>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-[0.15em] ml-8">{chart.desc}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })} aria-label={`Expandir ${chart.title}`}>
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => handleExport(chart.data, chart.title)} aria-label={`Exportar ${chart.title}`}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 h-[200px] sm:h-[280px] cursor-pointer" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })}>
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === 'bar' ? (
                  <BarChart data={chart.data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={9} hide />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} hide />
                    <ChartTooltip 
                      cursor={{ fill: 'hsl(var(--primary) / 0.08)', radius: 6 }} 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        border: '1px solid hsl(var(--border))', 
                        background: 'hsl(var(--card))',
                        boxShadow: '0 8px 32px -4px hsl(var(--primary) / 0.15)',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 2, 2]} barSize={20} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie 
                      data={chart.data} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius="55%" 
                      outerRadius="80%" 
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                      paddingAngle={4}
                      className="focus:outline-none"
                    >
                      {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="hover:opacity-80 transition-opacity drop-shadow-[0_0_6px_currentColor]" />)}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        border: '1px solid hsl(var(--border))', 
                        background: 'hsl(var(--card))',
                        boxShadow: '0 8px 32px -4px hsl(var(--primary) / 0.15)',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ paddingTop: '12px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailChart} onOpenChange={() => setDetailChart(null)}>
        <DialogContent className="max-w-3xl rounded-2xl border border-border/30 shadow-2xl shadow-primary/10 p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-6 pb-3 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-lg shadow-primary/20">
                {detailChart?.type === 'bar' ? <BarChart3 className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
              <DialogTitle className="text-xl font-black tracking-tight">{detailChart?.title}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-6 h-[400px]">
            {detailChart && (
              <ResponsiveContainer width="100%" height="100%">
                {detailChart.type === 'bar' ? (
                  <BarChart data={detailChart.data} margin={{ bottom: 60, top: 10 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} />
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 2, 2]} barSize={28} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie data={detailChart.data} dataKey="value" nameKey="name" outerRadius={130} innerRadius={75} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} paddingAngle={3} stroke="hsl(var(--border))" strokeWidth={1}>
                      {detailChart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontWeight: 'bold' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
          <div className="p-4 border-t border-border/20 flex justify-end">
            <Button variant="outline" className="rounded-lg font-bold text-sm" onClick={() => setDetailChart(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
