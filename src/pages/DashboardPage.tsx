import { useState, useMemo } from 'react';
import { Activity, Download, Users, Layers3, TrendingUp, BarChart3, Clock, Package, ChevronRight, FolderOpen, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useDashboard } from '@/hooks/useDashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatCards } from '@/components/dashboard/StatCards';
import { TimelineChart, SummaryChart } from '@/components/dashboard/DashboardCharts';
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
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 sm:space-y-8 lg:space-y-10 max-w-[2000px] mx-auto overflow-x-hidden">
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
      
      {/* Stat Cards - now clickable to open detail dialogs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        <button 
          onClick={() => setDetailDialog('conferentes')} 
          className="group cursor-pointer rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.97] relative text-left w-full animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="p-6 sm:p-7 flex flex-row items-center gap-5 relative z-10">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-4xl sm:text-5xl font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-300">{stats.totalConferentes}</div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1 group-hover:text-primary/70 transition-colors">Conferentes</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-all duration-300 transform group-hover:translate-x-1" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button 
          onClick={() => setDetailDialog('conferences')} 
          className="group cursor-pointer rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.97] relative text-left w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75"
        >
          <div className="p-6 sm:p-7 flex flex-row items-center gap-5 relative z-10">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-4xl sm:text-5xl font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-300">{stats.totalConferencias}</div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1 group-hover:text-primary/70 transition-colors">Conferências</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-all duration-300 transform group-hover:translate-x-1" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button 
          onClick={() => setDetailDialog('registros')} 
          className="group cursor-pointer rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.97] relative text-left w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
        >
          <div className="p-6 sm:p-7 flex flex-row items-center gap-5 relative z-10">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <Layers3 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-4xl sm:text-5xl font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-300">{stats.totalRegistros}</div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1 group-hover:text-primary/70 transition-colors">Registros</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-all duration-300 transform group-hover:translate-x-1" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
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
          <div className="overflow-y-auto max-h-[60vh]">
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
                {conferenteDetails.map(c => (
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
          <div className="overflow-y-auto max-h-[60vh]">
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
                {conferenceDetails.map(c => (
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
          <div className="overflow-y-auto max-h-[60vh]">
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
