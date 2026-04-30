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
import { TimelineChart, SummaryChart, OccupationChart } from '@/components/dashboard/DashboardCharts';
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
    handleExportPDF,
  } = useDashboard();

  const handleFullExportExcel = async () => {
    const { exportToExcel } = await import('@/lib/export-utils');
    
    // Preparar dados para exportação
    const exportData = [
      { Categoria: 'MÉTRICAS GERAIS', Informação: '', Valor: '' },
      { Categoria: 'Total de Conferentes', Informação: '', Valor: stats.totalConferentes },
      { Categoria: 'Total de Conferências', Informação: '', Valor: stats.totalConferencias },
      { Categoria: 'Total de Registros', Informação: '', Valor: stats.totalRegistros },
      { Categoria: 'Média de Sessão', Informação: '', Valor: stats.avgDuration },
      { Categoria: '', Informação: '', Valor: '' },
      { Categoria: 'PRODUÇÃO POR CONFERENTE', Informação: 'Registros', Valor: 'Conferências' },
      ...stats.topConferentes.map(c => ({
        Categoria: c.name,
        Informação: c.count,
        Valor: c.conferences || 0
      }))
    ];

    await exportToExcel(exportData, 'Relatorio_Dashboard');
  };

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

  const lastOutputs = useMemo(() => {
    const allRegistros = history.flatMap(conf => 
      conf.registros.map(reg => ({
        id: `${conf.id}-${reg.nf || reg.processo || Math.random()}`,
        date: conf.date,
        item: reg.processo || reg.nf || reg.item || 'Item sem identificação',
        quantity: reg.quantidade || reg.mLinear || reg.m2 || 0,
        unit: reg.modoOrigem === 'madeira' ? 'm' : 'un'
      }))
    );
    return allRegistros.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [history]);

  return (
    <div id="dashboard-content" className="space-y-5 sm:space-y-6 lg:space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out pb-12 sm:pb-16 px-3 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-border/10 bg-background/80 backdrop-blur-2xl pt-4 sm:pt-6 rounded-b-[1.5rem] sm:rounded-b-[2.5rem]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/5 border border-primary/10">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-2xl sm:text-[clamp(2rem,6vw,3.5rem)] font-black tracking-tight text-foreground leading-[1.1]">
              Dashboard
            </h1>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-6 no-print w-full">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-border/20 bg-muted/40 backdrop-blur-xl shadow-sm min-w-fit">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70 shrink-0" />
            <div className="flex flex-col gap-0.5 sm:gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Média de Sessão</span>
              <span className="text-sm sm:text-base font-bold text-foreground leading-none">{stats.avgDuration}</span>
            </div>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="default" 
                size="lg"
                className="h-11 sm:h-14 px-5 sm:px-8 rounded-2xl shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 sm:gap-3 font-bold uppercase tracking-widest text-[10px] sm:text-[11px] bg-primary hover:bg-primary/90 whitespace-nowrap" 
                onClick={handleFullExportExcel}
              >
                <Download className="w-4 h-4" />
                Exportar Dados
              </Button>
            </TooltipTrigger>
            <TooltipContent className="font-bold text-[10px] uppercase tracking-wider py-2">Baixar Relatório Executivo</TooltipContent>
          </Tooltip>
        </div>
      </header>
      
      {/* Premium Stat Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 pt-3 sm:pt-6 relative z-10 w-full overflow-hidden">
        {[
          { id: 'conferentes', label: 'Conferentes', value: stats.totalConferentes, icon: Users, delay: '100' },
          { id: 'conferences', label: 'Conferências', value: stats.totalConferencias, icon: BarChart3, delay: '200' },
          { id: 'registros', label: 'Registros', value: stats.totalRegistros, icon: Layers3, delay: '300' },
        ].map((stat, idx) => (
          <button 
            key={stat.id}
            onClick={() => setDetailDialog(stat.id)} 
            className={`group relative cursor-pointer rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-border/20 bg-card/60 backdrop-blur-xl p-4 sm:p-6 lg:p-10 text-left transition-all duration-500 hover:border-primary/40 hover:bg-card/90 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] active:scale-[0.98] animate-in slide-in-from-bottom-8 overflow-hidden shadow-sm flex flex-col justify-between min-h-[8rem] sm:min-h-[10rem] lg:min-h-[12rem] ${idx === 2 ? 'xs:col-span-2 lg:col-span-1' : ''}`}
            style={{ animationDelay: `${stat.delay}ms` }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-8 relative z-10">
              <div className="p-2.5 sm:p-4 rounded-[1rem] sm:rounded-[1.25rem] bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-tighter">Detalhes</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3 relative z-10">
              <div className="text-[clamp(1.75rem,8vw,3.5rem)] font-black tracking-tighter tabular-nums text-foreground group-hover:text-primary transition-colors duration-500 leading-none">
                {stat.value}
              </div>
              <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground group-hover:text-primary/70 transition-colors duration-500 leading-relaxed">
                {stat.label}
              </p>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 w-full overflow-hidden">
        <div className="lg:col-span-8 space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-border/20 bg-card/10 backdrop-blur-md p-1 overflow-hidden transition-all duration-700 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/[0.02]">
            <TimelineChart data={stats.timeline} onExport={handleExport} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <OccupationChart title="Ocupação Tecidos" used={41} total={3120} reserved={0} blocked={0} unit="alocações" />
            <OccupationChart 
              title="Ocupação Madeira" 
              used={0} 
              total={0} 
              unit="metros"
              customCategories={[
                { name: 'Lâminas', value: 0 },
                { name: 'Bases', value: 0 },
                { name: 'Bandôs', value: 0 },
                { name: 'Avarias', value: 0 },
              ]}
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:space-y-8">
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
            desc="Carga de trabalho por setor" 
            data={stats.categorias} 
            type="pie" 
            icon={Layers3} 
            chartKey="value"
            onDetailClick={setDetailChart} 
          />
        </div>

        <div className="lg:col-span-4 h-full">
          <SummaryChart 
            title="Tipos de Materiais" 
            desc="Classificação de itens" 
            data={stats.tipos} 
            type="pie" 
            icon={TrendingUp} 
            chartKey="value"
            onDetailClick={setDetailChart} 
          />
        </div>

        <div className="lg:col-span-4 h-full">
          <SummaryChart
            title="Histórico de Sessões"
            desc="Últimas conferências"
            data={registrosPerConference.slice(0, 10)}
            type="bar"
            icon={Package}
            chartKey="value"
            onDetailClick={setDetailChart}
          />
        </div>
        
        <div className="lg:col-span-4 relative group rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-border/20 bg-primary/[0.02] backdrop-blur-xl p-5 sm:p-6 lg:p-8 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 lg:space-y-6 overflow-hidden transition-all duration-700 hover:bg-primary/[0.05] hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/[0.05]">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full scale-150 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="relative p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
              <Download className="w-7 h-7 sm:w-10 sm:h-10" />
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-extrabold text-lg sm:text-2xl tracking-tight text-foreground/90">Relatório Executivo</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto font-medium opacity-80">Compilado profissional de todas as métricas em formato Excel.</p>
          </div>
          <Button 
            variant="default" 
            size="lg" 
            onClick={handleFullExportExcel} 
            className="w-full rounded-2xl h-11 sm:h-14 font-extrabold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-[11px] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.97] mt-2 sm:mt-4"
          >
            Exportar Dados
          </Button>
          
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        </div>
      </div>

      <DetailDialog detailChart={detailChart} onClose={() => setDetailChart(null)} />

      {/* Conferentes Detail Dialog */}
      <Dialog open={detailDialog === 'conferentes'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 border-border/10 bg-background/80 backdrop-blur-2xl overflow-hidden rounded-[2.5rem] max-h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
          <DialogHeader className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8 border-b border-border/10 bg-muted/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-foreground">Conferentes</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground opacity-70">Desempenho individual por conferente</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/30 backdrop-blur-md z-10">
                <tr>
                  <th className="px-6 sm:px-10 py-4 sm:py-6 text-left font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Nome</th>
                  <th className="px-6 sm:px-10 py-4 sm:py-6 text-right font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Conferências</th>
                  <th className="px-6 sm:px-10 py-4 sm:py-6 text-right font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Registros</th>
                  <th className="px-6 sm:px-10 py-4 sm:py-6 text-right font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5 hidden xs:table-cell">Última Ativ.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {stats.conferenteDetails.map(c => (
                  <tr key={c.name} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-6 sm:px-10 py-4 sm:py-6 font-bold text-foreground/90 group-hover:text-primary transition-colors text-sm sm:text-base">{c.name}</td>
                    <td className="px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-muted-foreground font-semibold">{c.conferences}</td>
                    <td className="px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-primary font-black text-lg sm:text-xl">{c.total}</td>
                    <td className="px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-muted-foreground/60 text-[11px] sm:text-[12px] font-semibold hidden xs:table-cell">{formatDateBR(c.lastDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-border/10 bg-muted/5 flex justify-end">
            <Button variant="outline" className="rounded-xl font-bold text-sm px-6 h-10 hover:bg-primary hover:text-white transition-all" onClick={() => setDetailDialog(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conferences Detail Dialog */}
      <Dialog open={detailDialog === 'conferences'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 gap-0 border-border/10 bg-background/80 backdrop-blur-2xl overflow-hidden rounded-[2.5rem] max-h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
          <DialogHeader className="px-10 pt-10 pb-8 border-b border-border/10 bg-muted/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-foreground">Histórico de Conferências</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground opacity-70">Linha do tempo detalhada das sessões operacionais</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/30 backdrop-blur-md z-10">
                <tr>
                  <th className="px-10 py-6 text-left font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Processo</th>
                  <th className="px-10 py-6 text-left font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5 hidden sm:table-cell">Conferente</th>
                  <th className="px-10 py-6 text-center font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5 hidden xs:table-cell">Início</th>
                  <th className="px-10 py-6 text-center font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5 hidden md:table-cell">Fim</th>
                  <th className="px-10 py-6 text-center font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Duração</th>
                  <th className="px-10 py-6 text-right font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Registros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {conferenceSummary.map(c => (
                  <tr key={c.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-10 py-6 font-bold text-foreground/90 group-hover:text-primary truncate max-w-[120px] sm:max-w-[200px] transition-colors text-sm sm:text-base">{c.name}</td>
                    <td className="px-10 py-6 text-muted-foreground font-semibold truncate max-w-[120px] hidden sm:table-cell">{c.conferente || '—'}</td>
                    <td className="px-10 py-6 text-center font-mono text-emerald-500/80 text-[12px] font-bold hidden xs:table-cell">{formatTimeBR(c.startedAt)}</td>
                    <td className="px-10 py-6 text-center font-mono text-muted-foreground/60 text-[12px] font-semibold hidden md:table-cell">{formatTimeBR(c.finishedAt)}</td>
                    <td className="px-10 py-6 text-center">
                      <Badge variant="outline" className="text-[10px] font-bold px-4 py-1 rounded-full border-primary/20 text-primary bg-primary/5">{c.duration}</Badge>
                    </td>
                    <td className="px-10 py-6 text-right font-mono font-black text-primary text-xl">{c.registros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-border/10 bg-muted/5 flex justify-end">
            <Button variant="outline" className="rounded-xl font-bold text-sm px-6 h-10 hover:bg-primary hover:text-white transition-all" onClick={() => setDetailDialog(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registros per Conference Dialog */}
      <Dialog open={detailDialog === 'registros'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 border-border/10 bg-background/80 backdrop-blur-2xl overflow-hidden rounded-[2.5rem] max-h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
          <DialogHeader className="px-10 pt-10 pb-8 border-b border-border/10 bg-muted/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                <Layers3 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-foreground">Registros por Sessão</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground opacity-70">Volume de itens por conferência realizada</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/30 backdrop-blur-md z-10">
                <tr>
                  <th className="px-10 py-6 text-left font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Conferência</th>
                  <th className="px-10 py-6 text-left font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Conferente</th>
                  <th className="px-10 py-6 text-left font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Data</th>
                  <th className="px-10 py-6 text-right font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border/5">Registros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {history.slice(0, 50).map(conf => (
                  <tr key={conf.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-10 py-6 font-bold text-foreground/90 group-hover:text-primary truncate max-w-[150px] sm:max-w-[220px] transition-colors text-base">{conf.processo || conf.name}</td>
                    <td className="px-10 py-6 text-muted-foreground font-semibold">{conf.conferente || '—'}</td>
                    <td className="px-10 py-6 text-muted-foreground/60 font-mono text-[12px] font-semibold">{formatDateBR(conf.date)}</td>
                    <td className="px-10 py-6 text-right font-mono font-black text-primary text-xl">{conf.registros.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-border/10 bg-muted/5 flex justify-end">
            <Button variant="outline" className="rounded-xl font-bold text-sm px-6 h-10 hover:bg-primary hover:text-white transition-all" onClick={() => setDetailDialog(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
