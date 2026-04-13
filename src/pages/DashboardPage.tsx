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
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.2)',
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
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const statCards = [
    { label: 'Conferências', value: stats.totalConferencias, icon: BarChart3, tab: 'history', glow: 'shadow-primary/20', accent: 'text-primary', ring: 'ring-primary/30' },
    { label: 'Registros', value: stats.totalRegistros, icon: Layers3, tab: 'table', glow: 'shadow-cyan-500/20', accent: 'text-cyan-400', ring: 'ring-cyan-500/30' },
    { label: 'Conferentes', value: stats.totalConferentes, icon: Users, tab: 'inicio', glow: 'shadow-sky-500/20', accent: 'text-sky-400', ring: 'ring-sky-500/30' },
  ];

  return (
    <div className="p-3 sm:p-8 lg:p-12 space-y-6 sm:space-y-12 max-w-[1600px] mx-auto overflow-x-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>Inteligência de Operação</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
            Dashboard de <span className="text-primary italic">Performance</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1.5 rounded-lg border-border/40 bg-card/40 text-foreground text-[10px] font-bold flex gap-2 shadow-sm border">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="tracking-widest uppercase">Sistema Ativo</span>
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/40 bg-card/40 backdrop-blur-md hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all shadow-sm" onClick={() => handleExport(history, 'Historico_Geral')}>
                <Download className="w-4 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-popover/95 backdrop-blur-md font-bold p-2 rounded-lg shadow-xl">Exportar Banco de Dados</TooltipContent>
          </Tooltip>
        </div>
      </header>
      
      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map(s => (
          <motion.div key={s.label} variants={item}>
            <Card 
              onClick={() => handleStatClick(s.tab)} 
              className="group cursor-pointer border border-border/40 bg-card/10 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:bg-card/30 hover:shadow-lg active:scale-[0.98] relative"
              role="button"
            >
              <CardContent className="p-8 flex flex-row items-center gap-6 relative z-10">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-4xl font-bold tracking-tight tabular-nums text-foreground group-hover:text-primary transition-colors duration-300">{s.value}</div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mt-1">{s.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline Area Chart - Full width top */}
        <Card className="md:col-span-3 group border border-border/40 bg-card/20 backdrop-blur-sm hover:bg-card/30 transition-all duration-500 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20" />
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>Volume de Operações</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Histórico recente de conferências</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleExport(stats.timeline, 'Timeline_Operacoes')}>
              <Download className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-6 pt-2 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  dx={-10}
                />
                <ChartTooltip 
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid hsl(var(--border) / 0.5)', 
                    background: 'hsl(var(--card) / 0.95)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Small Charts */}
        {[
          { title: 'Top Conferentes', data: stats.topConferentes, type: 'bar' as const, icon: Users, desc: 'Produção Individual', key: 'count' },
          { title: 'Distribuição', data: stats.categorias, type: 'pie' as const, icon: Layers3, desc: 'Setores Operacionais', key: 'value' },
          { title: 'Especificações', data: stats.tipos, type: 'pie' as const, icon: TrendingUp, desc: 'Materiais / Tipos', key: 'value' },
        ].map(chart => (
          <Card key={chart.title} className="group border border-border/40 bg-card/20 backdrop-blur-sm hover:bg-card/30 transition-all duration-500 shadow-sm overflow-hidden relative">
            <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <chart.icon className="w-3.5 h-3.5 text-primary" />
                  <span>{chart.title}</span>
                </CardTitle>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{chart.desc}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })}>
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-6 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === 'bar' ? (
                  <BarChart data={chart.data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" hide />
                    <Bar dataKey={chart.key} fill="hsl(var(--primary))" radius={[4, 4, 2, 2]} barSize={24} />
                    <ChartTooltip 
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border) / 0.5)', 
                        background: 'hsl(var(--card) / 0.95)',
                        fontSize: '11px'
                      }}
                    />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie 
                      data={chart.data} 
                      dataKey={chart.key} 
                      innerRadius="60%" 
                      outerRadius="85%" 
                      stroke="transparent"
                      paddingAngle={4}
                    >
                      {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border) / 0.5)', 
                        background: 'hsl(var(--card) / 0.95)',
                        fontSize: '11px'
                      }}
                    />
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
                    <defs>
                      <linearGradient id="detailBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} />
                    <Bar dataKey="count" fill="url(#detailBarGradient)" radius={[6, 6, 2, 2]} barSize={28} />
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
