import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Users, Layers3, BarChart3, TrendingUp, Download, Eye, LayoutDashboard, ChevronRight, Activity } from 'lucide-react';
import { computeStats, exportToExcel } from '@/lib/dashboard-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const CATEGORY_COLORS: Record<string, string> = {
  Tecido: '#6366f1',
  Madeira: '#f59e0b',
  'Motor/Controle': '#ef4444',
};

const TOOL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-12 max-w-7xl mx-auto overflow-x-hidden animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5 sm:space-y-3">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Sistema Pente Fino</span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-foreground leading-tight">Painel de <span className="text-primary">Controle</span></h1>
          <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-2xl leading-relaxed">Acompanhe em tempo real o desempenho das conferências e o fluxo de materiais da planta.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 rounded-xl border-primary/20 bg-primary/5 text-primary font-black flex gap-2">
            <Activity className="w-4 h-4 animate-pulse" />
            Sincronizado
          </Badge>
          <div className="h-8 w-[1px] bg-border/40 mx-2 hidden sm:block" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-border/60 hover:border-primary/40 transition-all hover:-translate-y-0.5" onClick={() => handleExport(history, 'Historico_Geral')}>
                <Download className="w-5 h-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar Histórico Completo</TooltipContent>
          </Tooltip>
        </div>
      </header>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        {[
          { label: 'Total de Conferências', value: stats.totalConferencias, icon: BarChart3, tab: 'history', color: 'from-blue-500/20 to-indigo-500/10 text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
          { label: 'Itens Registrados', value: stats.totalRegistros, icon: Layers3, tab: 'table', color: 'from-emerald-500/20 to-teal-500/10 text-teal-600 dark:text-teal-400', border: 'border-teal-500/20' },
          { label: 'Conferentes Ativos', value: stats.totalConferentes, icon: Users, tab: 'inicio', color: 'from-amber-500/20 to-orange-500/10 text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
        ].map(s => (
          <motion.div key={s.label} variants={item}>
            <Card 
              onClick={() => handleStatClick(s.tab)} 
              className={`group cursor-pointer border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-md overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10 ${s.border}`}
              role="button"
              aria-label={`Ver detalhes de ${s.label}`}
            >
              <CardContent className="p-0">
                <div className={`p-6 flex items-center justify-between bg-gradient-to-br ${s.color}`}>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{s.label}</p>
                    <div className="text-4xl sm:text-5xl font-black tracking-tighter tabular-nums">{s.value}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/20 dark:bg-black/20 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                    <s.icon className="w-8 h-8" />
                  </div>
                </div>
                <div className="px-6 py-3 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30">
                  <span>Atualizado agora</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {[
          { title: 'Conferentes em Destaque', data: stats.topConferentes, type: 'bar' as const, icon: Users, desc: 'Top conferentes por volume de registros' },
          { title: 'Distribuição por Categoria', data: stats.categorias, type: 'pie' as const, icon: Layers3, desc: 'Proporção de materiais processados' },
          { title: 'Ferramentas Utilizadas', data: stats.ferramentas, type: 'bar' as const, icon: BarChart3, desc: 'Frequência de uso por ferramenta' },
          { title: 'Tipos de Materiais', data: stats.tipos, type: 'pie' as const, icon: TrendingUp, desc: 'Variedade de especificações processadas' },
        ].map(chart => (
          <Card key={chart.title} className="group border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-border/30 bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                    <chart.icon className="w-4 h-4" />
                  </div>
                  {chart.title}
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-widest">{chart.desc}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })} aria-label={`Expandir ${chart.title}`}>
                  <Eye className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleExport(chart.data, chart.title)} aria-label={`Exportar dados de ${chart.title}`}>
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 h-[220px] sm:h-[300px] cursor-pointer group/content" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })}>
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === 'bar' ? (
                  <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={10} hide />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} hide />
                    <ChartTooltip 
                      cursor={{fill: 'hsl(var(--primary) / 0.05)', radius: 8}} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 8, 8]} barSize={24} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie 
                      data={chart.data} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={65} 
                      outerRadius={95} 
                      stroke="none" 
                      paddingAngle={6}
                      className="focus:outline-none"
                    >
                      {chart.data.map((_, i) => <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} className="hover:opacity-80 transition-opacity" />)}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!detailChart} onOpenChange={() => setDetailChart(null)}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
          <DialogHeader className="p-8 pb-4 bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                {detailChart?.type === 'bar' ? <BarChart3 className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">{detailChart?.title}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-8 h-[450px]">
            {detailChart && (
                <ResponsiveContainer width="100%" height="100%">
                    {detailChart.type === 'bar' ? (
                      <BarChart data={detailChart.data} margin={{ bottom: 60, top: 10 }}>
                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} />
                        <ChartTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 6, 6]} barSize={32} />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie 
                          data={detailChart.data} 
                          dataKey="value" 
                          nameKey="name" 
                          outerRadius={140} 
                          innerRadius={80} 
                          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          paddingAngle={4}
                        >
                          {detailChart.data.map((_, i) => <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                      </PieChart>
                    )}
                </ResponsiveContainer>
            )}
          </div>
          <div className="p-6 bg-muted/20 border-t border-border/30 flex justify-end">
             <Button variant="outline" className="rounded-xl font-bold" onClick={() => setDetailChart(null)}>Fechar Visualização</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
