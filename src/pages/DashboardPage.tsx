import { useState, useMemo } from 'react';
import { Activity, Download, Users, Layers3, TrendingUp, BarChart3, Clock, Package, ChevronRight, FolderOpen, Calendar, Waves, TreePine, Settings2, Warehouse, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatCards } from '@/components/dashboard/StatCards';
import { TimelineChart, SummaryChart } from '@/components/dashboard/DashboardCharts';
import MadeiraDashboard from '@/components/dashboard/MadeiraDashboard';
import { DetailDialog } from '@/components/dashboard/DetailDialog';
import { formatDateBR, formatTimeBR } from '@/lib/app-utils';

function formatDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—';
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return '—';
    const diff = Math.abs(e - s);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hours > 0) return `${hours}h ${remainMins}min`;
    return `${mins}min`;
  } catch { return '—'; }
}

function SummaryStatCard({ label, value, percent, color, bg, border }: { label: string; value: string | number; percent?: number; color: string; bg: string; border: string }) {
  return (
    <div className={`p-4 text-center space-y-1 rounded-xl border ${border} ${bg} transition-all duration-200`}>
      <div className={`text-xl sm:text-2xl font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{label}</div>
      {percent !== undefined && (
        <div className="text-[10px] font-semibold text-muted-foreground/70">{percent}%</div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const {
    history,
    stats,
    detailChart,
    setDetailChart,
    handleStatClick,
    handleExport,
  } = useDashboard();

  const [detailDialog, setDetailDialog] = useState<string | null>(null);

  // Conference summary list (only 50 recent)
  const conferenceSummary = useMemo(() => {
    return history.slice(0, 50).map(conf => ({
      id: conf.id,
      name: conf.processo || conf.name,
      conferente: conf.conferente,
      date: conf.date,
      startedAt: conf.startedAt,
      finishedAt: conf.finishedAt,
      registros: conf.registros.length,
      duration: formatDuration(conf.startedAt, conf.finishedAt),
    }));
  }, [history]);

  // Registros per conference (only top 30)
  const registrosPerConference = useMemo(() => {
    return history.slice(0, 30).map(conf => ({
      name: (conf.processo || conf.name || '').slice(0, 20),
      value: conf.registros.length,
    }));
  }, [history]);

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10 max-w-[2000px] mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-5 border-b border-border/40">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-lg">
            Acompanhe a produtividade, gerencie fluxos e exporte relatórios.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="outline" className="text-[10px] font-bold px-2.5 py-1 rounded-lg border-primary/20 text-primary bg-primary/5">
            <Clock className="w-3 h-3 mr-1" />
            Tempo médio: {stats.avgDuration}
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border/50 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors" onClick={() => handleExport(history, 'Historico_Geral')}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="font-semibold">Exportar Banco de Dados</TooltipContent>
          </Tooltip>
        </div>
      </header>
      
      {/* Stats cards removed */}

      {/* Quick Access Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Módulos do Sistema</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Tecido', icon: Waves, tab: 'tecido', color: 'bg-blue-500/10 text-blue-500', border: 'hover:border-blue-500/40' },
            { label: 'Madeira', icon: TreePine, tab: 'madeira', color: 'bg-emerald-500/10 text-emerald-500', border: 'hover:border-emerald-500/40' },
            { label: 'Motor', icon: Settings2, tab: 'motor', color: 'bg-orange-500/10 text-orange-500', border: 'hover:border-orange-500/40' },
            { label: 'Estoque', icon: Warehouse, tab: 'estoque', color: 'bg-purple-500/10 text-purple-500', border: 'hover:border-purple-500/40' },
            { label: 'Saída', icon: Archive, tab: 'saida', color: 'bg-rose-500/10 text-rose-500', border: 'hover:border-rose-500/40' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                onClick={() => handleStatClick(item.tab)}
                className={`group flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-all active:scale-[0.95] animate-in fade-in slide-in-from-bottom-2 duration-300 ${item.border}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`p-3 sm:p-4 rounded-xl mb-3 transition-transform group-hover:scale-110 duration-300 ${item.color}`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground/80 group-hover:text-primary transition-colors">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        <div className="md:col-span-2 xl:col-span-2">
          <TimelineChart data={stats.timeline} onExport={handleExport} />
        </div>

        <SummaryChart 
          title="Top Conferentes" 
          desc="Produção Individual" 
          data={stats.topConferentes} 
          type="bar" 
          icon={Users} 
          chartKey="count"
          onDetailClick={setDetailChart} 
        />
        
        {!isMobile && (
          <>
            <SummaryChart 
              title="Distribuição" 
              desc="Setores Operacionais" 
              data={stats.categorias} 
              type="pie" 
              icon={Layers3} 
              chartKey="value"
              onDetailClick={setDetailChart} 
            />

            <SummaryChart 
              title="Especificações" 
              desc="Materiais / Tipos" 
              data={stats.tipos} 
              type="pie" 
              icon={TrendingUp} 
              chartKey="value"
              onDetailClick={setDetailChart} 
            />

            <SummaryChart
              title="Registros por Conferência"
              desc="Volume por Sessão"
              data={registrosPerConference.slice(0, 10)}
              type="bar"
              icon={Package}
              chartKey="value"
              onDetailClick={setDetailChart}
            />
          </>
        )}
      </div>

      <DetailDialog detailChart={detailChart} onClose={() => setDetailChart(null)} />

      {/* Conferentes Detail Dialog */}
      <Dialog open={detailDialog === 'conferentes'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl max-h-[80vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Users className="w-5 h-5" /></div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">Conferentes</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Detalhes de todos os conferentes</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4 grid grid-cols-3 gap-3 bg-muted/5 border-b border-border/10">
            <SummaryStatCard label="Total" value={stats.totalConferentes} color="text-foreground" bg="bg-card" border="border-border/30" />
            <SummaryStatCard 
              label="Engajados" 
              value={stats.topConferentes.length} 
              percent={stats.totalConferentes ? Math.round((stats.topConferentes.length / stats.totalConferentes) * 100) : 0} 
              color="text-emerald-500" bg="bg-emerald-500/5" border="border-emerald-500/20" 
            />
            <SummaryStatCard 
              label="Recentes" 
              value={stats.conferenteDetails.filter(c => {
                const lastDate = new Date(c.lastDate);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return lastDate >= weekAgo;
              }).length} 
              percent={stats.totalConferentes ? Math.round((stats.conferenteDetails.filter(c => {
                const lastDate = new Date(c.lastDate);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return lastDate >= weekAgo;
              }).length / stats.totalConferentes) * 100) : 0} 
              color="text-primary" bg="bg-primary/5" border="border-primary/20" 
            />
          </div>
          <div className="p-6 h-[250px] border-b border-border/10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topConferentes.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip 
                  contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} 
                  formatter={(val: any) => [val, 'Registros']}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-y-auto max-h-[40vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Conferências</th>
                  <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Registros</th>
                  <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Último</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {stats.conferenteDetails.map(c => (
                  <tr key={c.name} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-bold text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{c.conferences}</td>
                    <td className="px-4 py-3 text-right font-mono text-primary font-bold">{c.total}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground/60 text-[10px]">{formatDateBR(c.lastDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conferences Detail Dialog */}
      <Dialog open={detailDialog === 'conferences'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl max-h-[80vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><BarChart3 className="w-5 h-5" /></div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">Conferências</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Detalhes com início, fim e duração</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4 grid grid-cols-3 gap-3 bg-muted/5 border-b border-border/10">
            <SummaryStatCard label="Total" value={stats.totalConferencias} color="text-foreground" bg="bg-card" border="border-border/30" />
            <SummaryStatCard 
              label="Concluídas" 
              value={history.filter(h => h.finishedAt).length} 
              percent={stats.totalConferencias ? Math.round((history.filter(h => h.finishedAt).length / stats.totalConferencias) * 100) : 0} 
              color="text-emerald-500" bg="bg-emerald-500/5" border="border-emerald-500/20" 
            />
            <SummaryStatCard 
              label="Tempo Médio" 
              value={stats.avgDuration} 
              color="text-primary" bg="bg-primary/5" border="border-primary/20" 
            />
          </div>
          <div className="p-6 h-[250px] border-b border-border/10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip 
                  contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} 
                  formatter={(val: any) => [val, 'Volume']}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-y-auto max-h-[40vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Processo</th>
                  <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Conferente</th>
                  <th className="px-4 py-3 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground">Início</th>
                  <th className="px-4 py-3 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground">Fim</th>
                  <th className="px-4 py-3 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground">Duração</th>
                  <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Itens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {conferenceSummary.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-bold text-foreground truncate max-w-[150px]">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[100px]">{c.conferente || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono text-emerald-500/80 text-[10px]">{formatTimeBR(c.startedAt)}</td>
                    <td className="px-4 py-3 text-center font-mono text-muted-foreground/60 text-[10px]">{formatTimeBR(c.finishedAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0 h-4 border-primary/20 text-primary/70 bg-primary/5">{c.duration}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-primary">{c.registros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registros per Conference Dialog */}
      <Dialog open={detailDialog === 'registros'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl max-h-[80vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Layers3 className="w-5 h-5" /></div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">Registros por Conferência</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Quantidade de itens registrados em cada conferência</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/5 border-b border-border/10">
            <SummaryStatCard label="Total" value={stats.totalRegistros} color="text-foreground" bg="bg-card" border="border-border/30" />
            {stats.categorias.map(cat => (
              <SummaryStatCard 
                key={cat.name}
                label={cat.name} 
                value={cat.value} 
                percent={stats.totalRegistros ? Math.round((cat.value / stats.totalRegistros) * 100) : 0} 
                color={cat.name === 'Tecido' ? 'text-primary' : cat.name === 'Madeira' ? 'text-emerald-500' : 'text-amber-500'} 
                bg={cat.name === 'Tecido' ? 'bg-primary/5' : cat.name === 'Madeira' ? 'bg-emerald-500/5' : 'bg-amber-500/5'} 
                border={cat.name === 'Tecido' ? 'border-primary/20' : cat.name === 'Madeira' ? 'border-emerald-500/20' : 'border-amber-500/20'} 
              />
            ))}
          </div>
          <div className="p-6 h-[250px] border-b border-border/10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats.categorias} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5}
                >
                  {stats.categorias.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['hsl(var(--primary))', 'hsl(var(--primary) / 0.7)', 'hsl(var(--primary) / 0.4)'][index % 3]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} 
                  formatter={(val: any) => [val, 'Itens']}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-y-auto max-h-[40vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Conferência</th>
                  <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Conferente</th>
                  <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Registros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {history.slice(0, 50).map(conf => (
                  <tr key={conf.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-bold text-foreground truncate max-w-[180px]">{conf.processo || conf.name}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[100px]">{conf.conferente || '—'}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground/60 text-[10px]">{formatDateBR(conf.date)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-primary text-base">{conf.registros.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
