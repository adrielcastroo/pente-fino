import { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Activity, Download, Users, Layers3, TrendingUp, BarChart3, Clock, Package, ChevronRight, FileText, Calendar, Loader2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDashboard } from '@/hooks/useDashboard';
import { StatCards } from '@/components/dashboard/StatCards';
import { TimelineChart, SummaryChart, OccupationChart, InventoryTimelineChart } from '@/components/dashboard/DashboardCharts';
import { DetailDialog } from '@/components/dashboard/DetailDialog';
import { formatDateBR } from '@/lib/app-utils';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CyclicNotification } from '@/components/inventory/CyclicNotification';
import { motion, AnimatePresence } from 'framer-motion';

function formatDuration(start: string | null | undefined, end: string | null | undefined): string {



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
  const dashboardDialogTheme = useAppStore(s => s.dashboardDialogTheme);
  const { theme: systemTheme } = useTheme();
  const isDark = dashboardDialogTheme === 'dark' || (dashboardDialogTheme === 'system' && systemTheme === 'dark');

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
    handleFullExport,
  } = useDashboard();

  const [isExporting, setIsExporting] = useState(false);
  const [detailDialog, setDetailDialog] = useState<string | null>(null);

  const handleFullExportExcel = async () => {
    setIsExporting(true);
    try {
      await handleFullExport(stats, history, 'Relatorio_Completo_Logistica');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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

  const lastOutputs = useMemo(() => {
    const allRegistros = history.flatMap(conf => 
      conf.registros.map((reg, idx) => ({
        id: `${conf.id}-${reg.id || idx}`,
        date: conf.date,
        item: reg.processo || reg.nf || reg.item || 'Item sem identificação',
        quantity: reg.quantidade || reg.mLinear || reg.m2 || 0,
        unit: reg.modoOrigem === 'madeira' ? 'm' : 'un'
      }))
    );
    return allRegistros.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    }).slice(0, 5);
  }, [history]);

  const allRegistrosDetailed = useMemo(() => {
    return history.flatMap(conf => 
      conf.registros.map(reg => ({
        ...reg,
        conferenceName: conf.processo || conf.name,
        date: conf.date
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history]);

  if (isHistoryLoading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-foreground/70 font-black animate-pulse uppercase tracking-wider text-sm">Carregando dados do dashboard...</p>
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
        <p className="text-foreground/60 max-w-md font-bold">{historyError}</p>
        <Button onClick={() => loadHistory()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      id="dashboard-content" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-[1600px] mx-auto pb-8 sm:pb-16 px-2 sm:px-6 lg:px-8"
    >
      {/* Header - Simple and Clean */}
      <header className="flex flex-col gap-4 sm:gap-6 pb-6 sm:pb-8 pt-4 sm:pt-8 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 sm:gap-4"
          >
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
              <Activity className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[clamp(1.5rem,8vw,3.5rem)] font-black tracking-tight text-foreground leading-[1.1]">
                Dashboard
              </h1>
              <p className="text-[9px] sm:text-xs font-black text-foreground/60 uppercase tracking-[0.2em] mt-1 sm:mt-2">
                Monitoramento Logístico & Operacional
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 sm:gap-4 self-end sm:self-center"
          >
            <div className="hidden md:flex items-center gap-3 px-6 py-3 rounded-2xl border border-border/10 bg-card/40 backdrop-blur-md transition-all hover:bg-card/60">
              <Clock className="w-5 h-5 text-primary/70 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-foreground/50 uppercase tracking-widest leading-tight">Média de Sessão</span>
                <span className="text-sm font-bold text-foreground leading-none">{stats.avgDuration}</span>
              </div>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="lg"
                  disabled={isExporting}
                  className="h-10 sm:h-16 px-4 sm:px-10 rounded-xl sm:rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 sm:gap-4 font-black uppercase tracking-widest text-[10px] sm:text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                  onClick={handleFullExportExcel}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
                  )}
                  {isExporting ? 'Processando...' : 'Exportar Excel'}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-bold text-[10px] uppercase tracking-wider py-2">Gerar Relatório Completo de Atividades</TooltipContent>
            </Tooltip>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex md:hidden items-center gap-3 px-4 py-2.5 mx-4 sm:mx-6 rounded-xl border border-border/10 bg-card/40 backdrop-blur-md w-fit transition-all hover:bg-card/60"
        >
          <Clock className="w-4 h-4 text-primary/70 shrink-0" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">Sessão:</span>
            <span className="text-xs font-bold text-foreground leading-none">{stats.avgDuration}</span>
          </div>
        </motion.div>
      </header>
      
      {/* Cyclic Inventory Notification */}
      <CyclicNotification />

      {/* Stat Cards - Consolidated and Optimized */}
      <StatCards stats={stats} onStatClick={(id) => id === 'conferentes' || id === 'registros' ? setDetailDialog(id) : setDetailDialog(id)} />


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 w-full overflow-hidden">
        <motion.div  />
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-8 space-y-4 sm:space-y-6 lg:space-y-8"
        >
          <div className="rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-border/20 bg-card/10 backdrop-blur-md p-1 overflow-hidden transition-all duration-700 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/[0.02]">
            <TimelineChart id="chart-timeline" data={stats.timeline} onExport={handleExport} onDetailClick={setDetailChart} />
          </div>
          
          <div className="rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-border/20 bg-card/10 backdrop-blur-md p-1 overflow-hidden transition-all duration-700 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/[0.02]">
            <InventoryTimelineChart />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <OccupationChart 
              id="chart-ocupacao-tecido" 
              title="Ocupação Tecidos" 
              used={stats.occupation.tecido.used} 
              total={stats.occupation.tecido.total} 
              reserved={stats.occupation.tecido.reserved} 
              blocked={stats.occupation.tecido.blocked} 
              unit="alocações" 
            />
            <OccupationChart 
              id="chart-ocupacao-madeira"
              title="Ocupação Madeira" 
              used={stats.occupation.madeira.used} 
              total={stats.occupation.madeira.total} 
              reserved={stats.occupation.madeira.reserved} 
              blocked={stats.occupation.madeira.blocked}
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
            id="chart-conferentes"
            title="Produção por Conferente" 
            desc="Top 5 em volume de registros" 
            data={stats.topConferentes} 
            type="bar" 
            icon={Users} 
            chartKey="value"
            onDetailClick={setDetailChart} 
          />
          
          <SummaryChart 
            id="chart-setores"
            title="Sectores Operacionais" 
            desc="Carga de trabalho por setor" 
            data={stats.categorias} 
            type="pie" 
            icon={Layers3} 
            chartKey="value"
            onDetailClick={setDetailChart} 
          />
          
          <Card className="rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-border/20 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-700 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/[0.02]">
            <CardHeader className="p-5 sm:p-6 border-b border-border/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <CardTitle className="text-lg font-black tracking-tight uppercase">Últimas Saídas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/5">
                {lastOutputs.length > 0 ? (
                  lastOutputs.map((output) => (
                    <div key={output.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-primary/[0.02] transition-colors group">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-[200px]">
                          {output.item}
                        </span>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">
                            {formatDateBR(output.date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-primary tabular-nums">
                          {output.quantity} {output.unit}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-foreground/60 font-black italic">Nenhum registro recente</p>
                  </div>
                )}
              </div>
              {lastOutputs.length > 0 && (
                <div className="p-4 border-t border-border/5 bg-muted/5">
                  <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest gap-2 text-foreground/60 hover:text-primary transition-colors h-8" onClick={() => setDetailDialog('conferences')}>
                    Ver Histórico Completo
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 h-full">
          <SummaryChart 
            id="chart-materiais"
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
            id="chart-sessoes"
            title="Histórico de Sessões"
            desc="Últimas conferências"
            data={registrosPerConference.slice(0, 10)}
            type="bar"
            icon={Package}
            chartKey="value"
            onDetailClick={setDetailChart}
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-4 relative group rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-border/20 bg-primary/[0.02] backdrop-blur-xl p-5 sm:p-6 lg:p-8 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 lg:space-y-6 overflow-hidden transition-all duration-700 hover:bg-primary/[0.05] hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/[0.05]"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full scale-150 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="relative p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 transition-transform duration-500"
            >
              <FileText className="w-7 h-7 sm:w-10 sm:h-10" />
            </motion.div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-extrabold text-lg sm:text-2xl tracking-tight text-foreground">Relatório Executivo</h3>
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed max-w-[240px] mx-auto font-bold">Compilado profissional de todas as métricas em formato Excel.</p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
            <Button 
              className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 group/btn"
              onClick={handleFullExportExcel}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" />}
              {isExporting ? 'Processando' : 'Baixar Relatório'}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Detail Dialogs */}
      <DetailDialog detailChart={detailChart} onClose={() => setDetailChart(null)} />

      {/* Conferentes Detail Dialog */}
      <Dialog open={detailDialog === 'conferentes'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className={cn(
          "max-w-[95vw] sm:max-w-4xl p-0 gap-0 overflow-hidden rounded-[2.5rem] h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col border-border/10",
          isDark ? "bg-[#0F172A] border-slate-800" : "bg-white text-[#2563EB]"
        )}>
          <DialogHeader className={cn(
            "px-6 sm:px-10 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b flex-none",
            isDark ? "bg-[#1E293B]/50 border-slate-800" : "bg-slate-50/50 border-border/10"
          )}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className={cn("text-3xl font-black tracking-tight", isDark ? "text-slate-100" : "text-[#2563EB]")}>Conferentes</DialogTitle>
                  <DialogDescription className={cn("text-sm font-bold", isDark ? "text-slate-400" : "text-[#2563EB]/70")}>Desempenho individual por conferente</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm">
              <thead className={cn("sticky top-0 z-20", isDark ? "bg-[#0F172A]" : "bg-white")}>
                <tr>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-left font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Nome</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Conferências</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Registros</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b hidden xs:table-cell", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Última Ativ.</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-border/5")}>
                {stats.conferenteDetails.map(c => (
                  <tr key={c.name} className={cn("transition-colors group", isDark ? "hover:bg-slate-800/50" : "hover:bg-primary/[0.02]")}>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 font-bold group-hover:text-[#2563EB] transition-colors text-sm sm:text-base", isDark ? "text-slate-200" : "text-[#2563EB]/90")}>{c.name}</td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-mono font-bold", isDark ? "text-slate-400" : "text-[#2563EB]/70")}>{c.conferences}</td>
                    <td className="px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-primary font-black text-lg sm:text-xl">{c.total}</td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-[11px] sm:text-[12px] font-bold hidden xs:table-cell", isDark ? "text-slate-500" : "text-[#2563EB]/50")}>{formatDateBR(c.lastDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={cn("p-6 border-t flex justify-end flex-none", isDark ? "bg-slate-900/50 border-slate-800" : "bg-muted/5 border-border/10")}>
            <Button variant="outline" className={cn("rounded-xl font-bold text-sm px-6 h-10 hover:bg-[#2563EB] hover:text-white transition-all", isDark ? "border-slate-700 text-slate-300 hover:border-primary" : "border-[#2563EB]/20 text-[#2563EB]")} onClick={() => setDetailDialog(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conferences Detail Dialog */}
      <Dialog open={detailDialog === 'conferences'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className={cn(
          "max-w-[95vw] sm:max-w-4xl p-0 gap-0 overflow-hidden rounded-[2.5rem] h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col border-border/10",
          isDark ? "bg-[#0F172A] border-slate-800" : "bg-white text-[#2563EB]"
        )}>
          <DialogHeader className={cn(
            "px-6 sm:px-10 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b flex-none",
            isDark ? "bg-[#1E293B]/50 border-slate-800" : "bg-slate-50/50 border-border/10"
          )}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className={cn("text-3xl font-black tracking-tight", isDark ? "text-slate-100" : "text-[#2563EB]")}>Histórico de Conferências</DialogTitle>
                  <DialogDescription className={cn("text-sm font-bold", isDark ? "text-slate-400" : "text-[#2563EB]/70")}>Linha do tempo detalhada das sessões operacionais</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm">
              <thead className={cn("sticky top-0 z-20 shadow-sm", isDark ? "bg-[#0F172A]" : "bg-white")}>
                <tr>
                   <th className={cn("px-10 py-6 text-left font-black text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Processo</th>
                  <th className={cn("px-10 py-6 text-left font-black text-[11px] uppercase tracking-[0.2em] border-b hidden sm:table-cell", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Conferente</th>
                  <th className={cn("px-10 py-6 text-center font-black text-[11px] uppercase tracking-[0.2em] border-b hidden xs:table-cell", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Início</th>
                  <th className={cn("px-10 py-6 text-center font-black text-[11px] uppercase tracking-[0.2em] border-b hidden md:table-cell", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Fim</th>
                  <th className={cn("px-10 py-6 text-center font-black text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Duração</th>
                  <th className={cn("px-10 py-6 text-right font-black text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Registros</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-border/5")}>
                {conferenceSummary.map(c => (
                  <tr key={c.id} className={cn("transition-colors group", isDark ? "hover:bg-slate-800/50" : "hover:bg-primary/[0.02]")}>
                    <td className={cn("px-10 py-6 font-bold group-hover:text-[#2563EB] truncate max-w-[120px] sm:max-w-[200px] transition-colors text-sm sm:text-base", isDark ? "text-slate-200" : "text-[#2563EB]/90")}>{c.name}</td>
                    <td className={cn("px-10 py-6 font-bold truncate max-w-[120px] hidden sm:table-cell", isDark ? "text-slate-400" : "text-[#2563EB]/70")}>{c.conferente || '—'}</td>
                    <td className="px-10 py-6 text-center font-mono text-emerald-500/80 text-[12px] font-bold hidden xs:table-cell">{formatTimeBR(c.startedAt)}</td>
                    <td className={cn("px-10 py-6 text-center font-mono text-[12px] font-bold hidden md:table-cell", isDark ? "text-slate-500" : "text-[#2563EB]/50")}>{formatTimeBR(c.finishedAt)}</td>
                    <td className="px-10 py-6 text-center">
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-4 py-1 rounded-full border-[#2563EB]/20 text-[#2563EB] bg-[#2563EB]/5")}>{c.duration}</Badge>
                    </td>
                    <td className="px-10 py-6 text-right font-mono text-primary font-black text-xl">{c.registros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={cn("p-6 border-t flex justify-end flex-none", isDark ? "bg-slate-900/50 border-slate-800" : "bg-muted/5 border-border/10")}>
            <Button variant="outline" className={cn("rounded-xl font-bold text-sm px-8 h-12 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition-all active:scale-[0.97]", isDark ? "border-slate-700 text-slate-300 hover:border-primary" : "border-[#2563EB]/20 text-[#2563EB]")} onClick={() => setDetailDialog(null)}>
              Fechar Histórico
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registros Detail Dialog */}
      <Dialog open={detailDialog === 'registros'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className={cn(
          "max-w-[95vw] sm:max-w-5xl p-0 gap-0 overflow-hidden rounded-[2.5rem] h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col border-border/10",
          isDark ? "bg-[#0F172A] border-slate-800" : "bg-white text-[#2563EB]"
        )}>
          <DialogHeader className={cn(
            "px-6 sm:px-10 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b flex-none",
            isDark ? "bg-[#1E293B]/50 border-slate-800" : "bg-slate-50/50 border-border/10"
          )}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                  <Layers3 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className={cn("text-3xl font-black tracking-tight", isDark ? "text-slate-100" : "text-[#2563EB]")}>Histórico de Registros</DialogTitle>
                  <DialogDescription className={cn("text-sm font-bold", isDark ? "text-slate-400" : "text-[#2563EB]/70")}>Listagem completa de todos os itens registrados</DialogDescription>
                </div>
              </div>
              
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm">
              <thead className={cn("sticky top-0 z-20 shadow-sm", isDark ? "bg-[#0F172A]" : "bg-white")}>
                <tr>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-left font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Item / NF</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-left font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b hidden sm:table-cell", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Conferência</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Qtd / Medida</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b hidden md:table-cell", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Endereço</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b hidden xs:table-cell", isDark ? "text-slate-400 border-slate-800" : "text-[#2563EB]/60 border-border/5")}>Data</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-border/5")}>
                {allRegistrosDetailed.map((reg, idx) => (
                  <tr key={idx} className={cn("transition-colors group", isDark ? "hover:bg-slate-800/50" : "hover:bg-primary/[0.02]")}>
                    <td className="px-6 sm:px-10 py-4 sm:py-6">
                      <div className="flex flex-col">
                        <span className={cn("font-bold transition-colors text-sm sm:text-base group-hover:text-[#2563EB]", isDark ? "text-slate-200" : "text-[#2563EB]/90")}>
                          {reg.processo || reg.nf || reg.item || 'Item sem identificação'}
                        </span>
                        {reg.item && reg.item !== (reg.processo || reg.nf) && (
                           <span className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-slate-500" : "text-[#2563EB]/40")}>{reg.item}</span>
                        )}
                      </div>
                    </td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 font-bold truncate max-w-[150px] hidden sm:table-cell", isDark ? "text-slate-400" : "text-[#2563EB]/70")}>
                      {reg.conferenceName}
                    </td>
                    <td className="px-6 sm:px-10 py-4 sm:py-6 text-right">
                      <div className="text-sm font-black text-primary tabular-nums">
                        {reg.quantidade || reg.mLinear || reg.m2 || 0} {reg.modoOrigem === 'madeira' ? 'm' : 'un'}
                      </div>
                    </td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-mono font-bold hidden md:table-cell", isDark ? "text-slate-400" : "text-[#2563EB]/70")}>
                      {reg.endereco || '—'}
                    </td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-[11px] sm:text-[12px] font-bold hidden xs:table-cell", isDark ? "text-slate-500" : "text-[#2563EB]/50")}>
                      {formatDateBR(reg.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={cn("p-6 border-t flex justify-end flex-none", isDark ? "bg-slate-900/50 border-slate-800" : "bg-muted/5 border-border/10")}>
            <Button variant="outline" className={cn("rounded-xl font-bold text-sm px-8 h-12 hover:bg-[#2563EB] hover:text-white transition-all", isDark ? "border-slate-700 text-slate-300 hover:border-primary" : "border-[#2563EB]/20 text-[#2563EB]")} onClick={() => setDetailDialog(null)}>
              Fechar Registros
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
    </div>
  );
}
