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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-xs">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-pulse" />
            <span>Inteligência de Operação</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[0.9] lg:leading-[0.85]">
            Painel de <br className="hidden sm:block lg:hidden" />
            <span className="text-primary relative inline-block">
              Controle
              <div className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-1 sm:h-2 bg-primary/20 rounded-full blur-sm" />
            </span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-2 rounded-xl border-primary/20 bg-primary/5 text-primary text-[10px] font-black flex gap-2 shadow-xl shadow-primary/5 border">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="tracking-widest uppercase">Sistema Ativo</span>
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border-border/40 bg-card/40 backdrop-blur-md hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all shadow-lg" onClick={() => handleExport(history, 'Historico_Geral')}>
                <Download className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-popover/95 backdrop-blur-md border-border/40 font-bold p-3 rounded-xl shadow-2xl">Exportar Banco de Dados (Excel)</TooltipContent>
          </Tooltip>
        </div>
      </header>
      
      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
        {statCards.map(s => (
          <motion.div key={s.label} variants={item}>
            <Card 
              onClick={() => handleStatClick(s.tab)} 
              className={`group cursor-pointer border-none bg-card/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] shadow-2xl relative ${s.glow}`}
              role="button"
              aria-label={`Ver detalhes de ${s.label}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 blur-2xl sm:blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
              <CardContent className="p-5 sm:p-10 flex flex-row items-center gap-4 sm:gap-6 relative z-10">
                <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-primary/5 border border-primary/10 ${s.accent} group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-6 group-hover:shadow-2xl group-hover:shadow-primary/40 transition-all duration-700`}>
                  <s.icon className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-3xl sm:text-6xl font-black tracking-tighter tabular-nums ${s.accent} group-hover:scale-105 transition-transform duration-700 origin-left drop-shadow-xl truncate`}>{s.value}</div>
                  <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground/60 mt-0.5 sm:mt-1 truncate">{s.label}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500 hidden xs:block" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        {[
          { title: 'Conferentes', data: stats.topConferentes, type: 'bar' as const, icon: Users, desc: 'Top Volume de Produção' },
          { title: 'Categorias', data: stats.categorias, type: 'pie' as const, icon: Layers3, desc: 'Distribuição Setorial' },
          { title: 'Ferramentas', data: stats.ferramentas, type: 'bar' as const, icon: BarChart3, desc: 'Fluxo de Processos' },
          { title: 'Materiais', data: stats.tipos, type: 'pie' as const, icon: TrendingUp, desc: 'Especificações Técnicas' },
        ].map(chart => (
          <Card key={chart.title} className="group border-none bg-card/30 backdrop-blur-md hover:bg-card/50 transition-all duration-700 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:h-full transition-all duration-700" />
            <CardHeader className="flex flex-row items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-border/10">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-base sm:text-xl font-black flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0 shadow-lg shadow-primary/5">
                    <chart.icon className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                  <span className="truncate tracking-tight">{chart.title}</span>
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground/40 font-bold uppercase tracking-widest ml-12">{chart.desc}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })} aria-label={`Expandir ${chart.title}`}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleExport(chart.data, chart.title)} aria-label={`Exportar ${chart.title}`}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-10 h-[250px] sm:h-[350px] cursor-pointer" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })}>
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === 'bar' ? (
                  <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={10} hide />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} hide />
                    <ChartTooltip 
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 12 }} 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid hsl(var(--border) / 0.5)', 
                        background: 'hsl(var(--card) / 0.9)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 20px 50px -10px hsl(var(--primary) / 0.2)',
                        fontWeight: '800',
                        fontSize: '13px',
                        padding: '12px 16px'
                      }}
                    />
                    <defs>
                      <linearGradient id={`gradient-${chart.title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="count" fill={`url(#gradient-${chart.title})`} radius={[10, 10, 4, 4]} barSize={32} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie 
                      data={chart.data} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius="60%" 
                      outerRadius="85%" 
                      stroke="transparent"
                      paddingAngle={6}
                      className="focus:outline-none"
                    >
                      {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-2xl" />)}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid hsl(var(--border) / 0.5)', 
                        background: 'hsl(var(--card) / 0.9)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 20px 50px -10px hsl(var(--primary) / 0.2)',
                        fontWeight: '800',
                        fontSize: '13px',
                        padding: '12px 16px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="rect" 
                      iconSize={10} 
                      wrapperStyle={{ 
                        paddingTop: '20px', 
                        fontSize: '10px', 
                        fontWeight: '900', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.15em',
                        color: 'hsl(var(--muted-foreground))'
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
