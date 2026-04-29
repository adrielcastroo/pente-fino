import { useState, useMemo, useEffect } from 'react';
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
    isHistoryLoading,
    historyError,
    loadHistory,
    stats,
    detailChart,
    setDetailChart,
    handleStatClick,
    handleExport,
  } = useDashboard();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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

  if (isHistoryLoading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Carregando dados do dashboard...</p>
      </div>
    );
  }

  if (historyError && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-2">
          <Activity className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold">Erro ao carregar dados</h3>
        <p className="text-muted-foreground max-w-md">{historyError}</p>
        <Button onClick={() => loadHistory()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/40">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Analytics Overview</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg leading-relaxed font-medium opacity-80">
            Monitoramento inteligente de produtividade. Insights em tempo real sobre o fluxo operacional da unidade.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/30 backdrop-blur-md shadow-sm">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">Média:</span>
            <span className="text-[11px] font-black text-foreground">{stats.avgDuration}</span>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="default" 
                size="sm"
                className="h-10 px-6 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2 font-bold uppercase tracking-widest text-[10px]" 
                onClick={() => handleExport(history, 'Historico_Geral')}
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Dados
              </Button>
            </TooltipTrigger>
            <TooltipContent className="font-bold text-[10px] uppercase tracking-wider">Exportar Relatório Geral</TooltipContent>
          </Tooltip>
        </div>
      </header>
      
      {/* Premium Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {[
          { id: 'conferentes', label: 'Conferentes', value: stats.totalConferentes, icon: Users, delay: '0' },
          { id: 'conferences', label: 'Conferências', value: stats.totalConferencias, icon: BarChart3, delay: '75' },
          { id: 'registros', label: 'Registros', value: stats.totalRegistros, icon: Layers3, delay: '150' },
        ].map((stat) => (
          <button 
            key={stat.id}
            onClick={() => setDetailDialog(stat.id)} 
            className="group relative cursor-pointer rounded-3xl border border-border/40 bg-card/40 backdrop-blur-sm p-8 text-left transition-all duration-500 hover:border-primary/40 hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] animate-in slide-in-from-bottom-6"
            style={{ animationDelay: `${stat.delay}ms` }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <stat.icon className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500" />
            </div>
            
            <div className="space-y-1">
              <div className="text-4xl lg:text-5xl font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-500">
                {stat.value}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 group-hover:text-primary/70 transition-colors duration-500">
                {stat.label}
              </p>
            </div>
            
            {/* Visual Decorative Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          </button>
        ))}
      </div>

      {/* Premium Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <div className="lg:col-span-2 xl:col-span-2 group">
          <div className="relative rounded-[2rem] border border-border/40 bg-card/30 backdrop-blur-sm p-1 overflow-hidden transition-all duration-500 hover:border-primary/30">
            <TimelineChart data={stats.timeline} onExport={handleExport} />
          </div>
        </div>

        <div className="space-y-8">
          <SummaryChart 
            title="Produção por Conferente" 
            desc="Top 5 em volume de registros" 
            data={stats.topConferentes} 
            type="bar" 
            icon={Users} 
            chartKey="count"
            onDetailClick={setDetailChart} 
          />
          
          <SummaryChart 
            title="Sectores Operacionais" 
            desc="Distribuição de carga de trabalho" 
            data={stats.categorias} 
            type="pie" 
            icon={Layers3} 
            chartKey="value"
            onDetailClick={setDetailChart} 
          />
        </div>

        <SummaryChart 
          title="Tipos de Materiais" 
          desc="Classificação de itens conferidos" 
          data={stats.tipos} 
          type="pie" 
          icon={TrendingUp} 
          chartKey="value"
          onDetailClick={setDetailChart} 
        />

        <SummaryChart
          title="Histórico de Sessões"
          desc="Registros das últimas conferências"
          data={registrosPerConference.slice(0, 10)}
          type="bar"
          icon={Package}
          chartKey="value"
          onDetailClick={setDetailChart}
        />
        
        <div className="relative group rounded-[2rem] border border-border/40 bg-primary/[0.03] backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center space-y-6 overflow-hidden transition-all duration-500 hover:bg-primary/[0.06] hover:border-primary/20">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
            <div className="relative p-5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Download className="w-8 h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-lg tracking-tight">Relatório Executivo</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto font-medium">Gere um PDF compilado com todas as métricas para apresentação.</p>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleExport(history, 'Relatorio_Dashboard')} 
            className="w-full rounded-full h-11 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10"
          >
            Exportar PDF
          </Button>
          
          {/* Subtle bg glow */}
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[100px]" />
        </div>
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
                  <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground hidden xs:table-cell">Último</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {stats.conferenteDetails.map(c => (
                  <tr key={c.name} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-bold text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{c.conferences}</td>
                    <td className="px-4 py-3 text-right font-mono text-primary font-bold">{c.total}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground/60 text-[10px] hidden xs:table-cell">{formatDateBR(c.lastDate)}</td>
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
                  <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Conferente</th>
                  <th className="px-4 py-3 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground hidden xs:table-cell">Início</th>
                  <th className="px-4 py-3 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground hidden md:table-cell">Fim</th>
                  <th className="px-4 py-3 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground">Duração</th>
                  <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Itens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {conferenceSummary.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-bold text-foreground truncate max-w-[150px]">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[100px] hidden sm:table-cell">{c.conferente || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono text-emerald-500/80 text-[10px] hidden xs:table-cell">{formatTimeBR(c.startedAt)}</td>
                    <td className="px-4 py-3 text-center font-mono text-muted-foreground/60 text-[10px] hidden md:table-cell">{formatTimeBR(c.finishedAt)}</td>
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
