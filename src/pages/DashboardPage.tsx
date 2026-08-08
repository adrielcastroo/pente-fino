import { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Activity, Download, Users, Layers3, TrendingUp, BarChart3, Clock, Package, ChevronRight, FileText, Calendar, Loader2, ListChecks, Maximize2, Minimize2, FileDown, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useDashboard } from '@/hooks/useDashboard';
import { StatCards } from '@/components/dashboard/StatCards';
import { TimelineChart, SummaryChart, OccupationChart } from '@/components/dashboard/DashboardCharts';
import { AlertsCard } from '@/components/dashboard/AlertsCard';
import { DetailDialog } from '@/components/dashboard/DetailDialog';
import { ConferenteProfileDialog } from '@/components/dashboard/ConferenteProfileDialog';
import { SessionsHeatmap } from '@/components/dashboard/SessionsHeatmap';
import { NfPhysicalCompareDialog } from '@/components/dashboard/NfPhysicalCompareDialog';
import { PeriodComparisonCard } from '@/components/dashboard/PeriodComparisonCard';
import { formatDateBR, formatTimeBR } from '@/lib/app-utils';
import { formatPeriodLabel } from '@/lib/dashboard-utils';
import { cn, formatQty } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CyclicNotification } from '@/components/inventory/CyclicNotification';
import { motion } from 'framer-motion';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/page-header';
import Seo from '@/components/Seo';

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
  useDocumentTitle('Dashboard');
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
  const [showEmptyOutputs, setShowEmptyOutputs] = useState(false);
  const [selectedConferente, setSelectedConferente] = useState<string | null>(null);
  const [showMobileExtras, setShowMobileExtras] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);

  const togglePresentation = async () => {
    const next = !presentationMode;
    setPresentationMode(next);
    try {
      if (next && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen?.();
      }
    } catch { /* ignore */ }
    document.body.classList.toggle('presentation-mode', next);
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && presentationMode) {
        setPresentationMode(false);
        document.body.classList.remove('presentation-mode');
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.body.classList.remove('presentation-mode');
    };
  }, [presentationMode]);

  // Real-time: auto-refresh a cada 30s (pausa em background)
  const [autoRefresh, setAutoRefresh] = useState(true);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (!document.hidden) loadHistory();
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, loadHistory]);

  // Pop-out: abre o dashboard em janela separada (multi-monitor)
  const handlePopOut = () => {
    window.open('/estoque/dashboard', 'pente-fino-dashboard', 'width=1400,height=900,noopener');
  };

  // Export PDF do dashboard via html2canvas + jspdf
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const node = document.getElementById('dashboard-content');
      if (!node) return;
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: null, logging: false });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('Erro ao exportar PDF', e);
    } finally {
      setIsExportingPdf(false);
    }
  };
  const [compareConferenceId, setCompareConferenceId] = useState<string | null>(null);
  const compareConference = useMemo(
    () => history.find(c => c.id === compareConferenceId) ?? null,
    [history, compareConferenceId]
  );

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
    // Agrupa registros do mesmo item+data+unidade para evitar duplicatas visuais
    const grouped = new Map<string, { id: string; date: string; item: string; quantity: number; unit: string; count: number }>();
    history.forEach(conf => {
      conf.registros.forEach((reg, idx) => {
        const item = reg.processo || reg.nf || reg.item || 'Item sem identificação';
        const unit = reg.modoOrigem === 'madeira' ? 'm' : 'un';
        const key = `${item}|${conf.date}|${unit}`;
        const qty = reg.quantidade || reg.mLinear || reg.m2 || 0;
        const existing = grouped.get(key);
        if (existing) {
          existing.quantity += qty;
          existing.count += 1;
        } else {
          grouped.set(key, {
            id: `${conf.id}-${reg.id || idx}`,
            date: conf.date,
            item,
            quantity: qty,
            unit,
            count: 1,
          });
        }
      });
    });
    return Array.from(grouped.values())
      .filter(o => showEmptyOutputs || o.quantity > 0)
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      })
      .slice(0, 5);
  }, [history, showEmptyOutputs]);

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
        <p className="text-foreground/70 font-semibold animate-pulse text-sm">Carregando dados do dashboard...</p>
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
    <>
      <Seo
        title="Dashboard — Pente Fino"
        description="Painel executivo com métricas de conferência, ocupação, alertas e histórico do estoque têxtil em tempo real."
        path="/"
        noindex
      />
    <motion.div 
      id="dashboard-content" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8 xl:space-y-10 max-w-[1920px] mx-auto pb-8 sm:pb-16 px-2 sm:px-6 lg:px-8 overflow-x-hidden"
    >
      {/* Header - Simple and Clean */}
      <header className="flex flex-col gap-4 sm:gap-6 pb-6 sm:pb-8 pt-4 sm:pt-2 no-print">
        <div className="px-4 sm:px-6">
          <PageHeader title="Dashboard" actions={(
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAutoRefresh(v => !v)}
                className="hidden sm:inline-flex h-10 w-10 lg:h-12 lg:w-12 rounded-md shrink-0"
                title={autoRefresh ? 'Pausar atualização automática (30s)' : 'Ativar atualização automática (30s)'}
              >
                <RefreshCw className={cn('w-4 h-4 lg:w-5 lg:h-5', autoRefresh && 'text-primary animate-spin-slow')} />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="hidden sm:inline-flex h-10 w-10 lg:h-12 lg:w-12 rounded-md shrink-0"
                title="Exportar dashboard como PDF"
              >
                {isExportingPdf ? <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> : <FileDown className="w-4 h-4 lg:w-5 lg:h-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handlePopOut}
                className="hidden lg:inline-flex h-12 w-12 rounded-md shrink-0"
                title="Abrir em janela separada (multi-monitor)"
              >
                <ExternalLink className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={togglePresentation}
                className="hidden lg:inline-flex h-12 w-12 rounded-md shrink-0"
                title={presentationMode ? 'Sair do modo apresentação (Esc)' : 'Modo apresentação (F11)'}
              >
                {presentationMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="lg"
                    disabled={isExporting}
                    className="h-10 sm:h-12 px-4 sm:px-6 rounded-md font-semibold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap shrink-0"
                    onClick={handleFullExportExcel}
                  >
                    {isExporting && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />}
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" strokeWidth={2} />
                    <span>{isExporting ? 'Processando...' : 'Exportar'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="font-medium text-xs py-1.5">Gerar Relatório Completo de Atividades</TooltipContent>
              </Tooltip>
            </div>
          )} />
        </div>
        
      </header>
      
      {/* Cyclic Inventory Notification */}
      <CyclicNotification />

      {/* ============== SEÇÃO 1 — RESUMO EXECUTIVO ============== */}
      <section aria-labelledby="sec-resumo" className="space-y-5">
        <div className="px-1">
          <h2 id="sec-resumo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo executivo</h2>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">Alertas, indicadores principais e variação por período</p>
        </div>
        <AlertsCard stats={stats} />
        <PeriodComparisonCard history={history} />
        <StatCards stats={stats} onStatClick={(id) => id === 'conferentes' || id === 'registros' ? setDetailDialog(id) : setDetailDialog(id)} />
      </section>

      {/* Toggle mobile para revelar gráficos pesados */}
      <button
        type="button"
        onClick={() => setShowMobileExtras(v => !v)}
        className="md:hidden w-full rounded-md border border-border/30 bg-card/40 backdrop-blur py-3 px-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-foreground/70 hover:text-primary hover:border-primary/40 transition-colors"
      >
        <span>{showMobileExtras ? 'Ocultar gráficos detalhados' : 'Ver mais gráficos e detalhes'}</span>
        <ChevronRight className={cn("w-4 h-4 transition-transform", showMobileExtras && "rotate-90")} />
      </button>

      {/* ============== SEÇÕES 2-4 ============== */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 w-full overflow-hidden",
        !showMobileExtras && "hidden md:grid"
      )}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="md:col-span-2 lg:col-span-8 space-y-4 sm:space-y-6 lg:space-y-8"
        >
          <div className="overflow-hidden">
            <TimelineChart id="chart-timeline" data={stats.timeline} onExport={handleExport} onDetailClick={setDetailChart} periodLabel={formatPeriodLabel(7)} />
          </div>
          
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <OccupationChart 
                id="chart-ocupacao-tecido" 
                title="Ocupação Tecidos" 
                used={stats.occupation.tecido.used} 
                total={stats.occupation.tecido.total} 
                reserved={stats.occupation.tecido.reserved} 
                blocked={stats.occupation.tecido.blocked} 
                unit="alocações" 
              />
              {stats.occupation.tecido.semEspaco > 0 && (
                <p className="px-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {stats.occupation.tecido.semEspaco}
                  </span>{' '}
                  lote{stats.occupation.tecido.semEspaco === 1 ? '' : 's'} aguardando espaço no mapa
                </p>
              )}
            </div>
            {stats.occupation.madeira ? (
              <OccupationChart 
                id="chart-ocupacao-madeira"
                title="Ocupação Madeira" 
                used={stats.occupation.madeira.used} 
                total={stats.occupation.madeira.total} 
                reserved={stats.occupation.madeira.reserved} 
                blocked={stats.occupation.madeira.blocked}
                unit="metros"
              />
            ) : (
              <OccupationChart
                id="chart-ocupacao-chao"
                title="Alocados no CHÃO"
                used={stats.occupation.chao.used}
                total={stats.occupation.chao.used}
                reserved={0}
                blocked={0}
                unit="lotes"
              />
            )}
          </div>

          {/* Últimas Saídas — ocupa a zona morta abaixo das ocupações */}
          <Card className="rounded-lg border border-border/40 bg-card/50 shadow-none overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-border/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-medium tracking-tight">Últimas Saídas</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Registros mais recentes agrupados por item e data</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmptyOutputs(v => !v)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-primary h-8 px-2"
                  title={showEmptyOutputs ? 'Ocultar saídas vazias' : 'Mostrar saídas vazias'}
                >
                  {showEmptyOutputs ? 'Ocultar vazias' : 'Incluir vazias'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lastOutputs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30 bg-muted/20">
                        <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-2.5">Documento</th>
                        <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-2.5 hidden sm:table-cell">Data</th>
                        <th className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-2.5">Quantidade</th>
                        <th className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-5 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {lastOutputs.map((output) => {
                        const isEmpty = output.quantity <= 0;
                        return (
                          <tr key={output.id} className="hover:bg-primary/[0.03] transition-colors">
                            <td className="px-5 py-3 font-medium text-foreground/90 truncate max-w-[200px]">{output.item}</td>
                            <td className="px-5 py-3 text-muted-foreground tabular-nums text-xs hidden sm:table-cell">{formatDateBR(output.date)}</td>
                            <td className={cn("px-5 py-3 text-right tabular-nums font-semibold", isEmpty ? "text-muted-foreground" : "text-primary")}>
                              {formatQty(output.quantity)} <span className="text-xs text-muted-foreground font-normal">{output.unit}</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <Badge variant="outline" className={cn(
                                "text-[10px] font-medium px-2 py-0 h-5",
                                isEmpty
                                  ? "border-muted-foreground/30 text-muted-foreground bg-muted/30"
                                  : "border-emerald-500/30 text-success dark:text-success bg-emerald-500/5"
                              )}>
                                {isEmpty ? 'Vazia' : 'Concluído'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground italic">Nenhum registro recente</p>
                </div>
              )}
              {lastOutputs.length > 0 && (
                <div className="p-3 border-t border-border/30 bg-muted/10">
                  <button
                    type="button"
                    onClick={() => setDetailDialog('conferences')}
                    className="w-full text-xs text-slate-500 hover:text-sky-700 transition-colors h-7 font-normal"
                  >
                    Ver histórico completo
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="md:col-span-2 lg:col-span-4 space-y-4 sm:space-y-6 lg:space-y-8">
          <SummaryChart 
            id="chart-conferentes"
            title={stats.topConferentes.length > 0 ? `Top ${stats.topConferentes.length} Conferentes` : 'Conferentes'}
            desc="Por volume de registros" 
            data={stats.topConferentes} 
            type="bar" 
            icon={Users} 
            chartKey="value"
            onDetailClick={setDetailChart} 
          />
          
          <SummaryChart 
            id="chart-setores"
            title="Setores Operacionais" 
            desc="Registros por setor (Tecido = manual + diversos + etiq. pronta)" 
            data={[...stats.categorias].sort((a, b) => (b.value || 0) - (a.value || 0))} 
            type="bar" 
            icon={Layers3} 
            chartKey="value"
            onDetailClick={setDetailChart} 
          />
          
        </div>


        <div className="md:col-span-1 lg:col-span-4 h-full">
          <SummaryChart 
            id="chart-materiais"
            title="Top itens cadastrados" 
            desc="Top 8 itens por nº de registros — inclui itens sem cadastro" 

            data={[...stats.tipos].sort((a, b) => (b.value || 0) - (a.value || 0))} 
            type="bar" 
            icon={TrendingUp} 
            chartKey="value"
            onDetailClick={setDetailChart} 
          />
        </div>

        <div className="md:col-span-1 lg:col-span-4 h-full">
          <SessionsHeatmap history={history} weeks={12} />
        </div>
        
      </div>

      {/* Detail Dialogs */}
      <DetailDialog detailChart={detailChart} onClose={() => setDetailChart(null)} />

      <ConferenteProfileDialog
        conferente={selectedConferente}
        history={history}
        onClose={() => setSelectedConferente(null)}
      />

      <NfPhysicalCompareDialog
        open={!!compareConference}
        onOpenChange={(v) => !v && setCompareConferenceId(null)}
        conference={compareConference}
      />

      {/* Conferentes Detail Dialog */}
      <Dialog open={detailDialog === 'conferentes'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className={cn(
          "max-w-[95vw] sm:max-w-4xl p-0 gap-0 overflow-hidden rounded-[2.5rem] h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col border-border",
          isDark ? "bg-card border-border" : "bg-card text-primary"
        )}>
          <DialogHeader className={cn(
            "px-6 sm:px-10 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b flex-none",
            isDark ? "bg-muted/30 border-border" : "bg-muted/30 border-border"
          )}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className={cn("text-3xl font-semibold tracking-tight", isDark ? "text-foreground" : "text-primary")}>Conferentes</DialogTitle>
                  <DialogDescription className={cn("text-sm font-bold", isDark ? "text-muted-foreground" : "text-muted-foreground")}>Desempenho individual por conferente</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
              <thead className={cn("sticky top-0 z-20", isDark ? "bg-card" : "bg-card")}>
                <tr>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-left font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Nome</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Conferências</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Registros</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b hidden xs:table-cell", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Última Ativ.</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-border" : "divide-border")}>
                {stats.conferenteDetails.map(c => (
                  <tr
                    key={c.name}
                    onClick={() => setSelectedConferente(c.name)}
                    className={cn("transition-colors group cursor-pointer", isDark ? "hover:bg-muted/40" : "hover:bg-muted/40")}
                    title="Ver perfil do conferente"
                  >
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 font-bold group-hover:text-primary transition-colors text-sm sm:text-base", isDark ? "text-foreground" : "text-foreground")}>{c.name}</td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-mono font-bold", isDark ? "text-muted-foreground" : "text-muted-foreground")}>{c.conferences}</td>
                    <td className="px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-primary font-semibold text-lg sm:text-xl">{c.total}</td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-[11px] sm:text-[12px] font-bold hidden xs:table-cell", isDark ? "text-muted-foreground/70" : "text-muted-foreground/70")}>{formatDateBR(c.lastDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
          <div className={cn("p-6 border-t flex justify-end flex-none", isDark ? "bg-muted/30 border-border" : "bg-muted/30 border-border")}>
            <Button variant="outline" className={cn("rounded-md font-bold text-sm px-6 h-10 hover:bg-primary hover:text-white transition-all", isDark ? "border-border text-foreground hover:border-primary" : "border-primary/20 text-primary")} onClick={() => setDetailDialog(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conferences Detail Dialog */}
      <Dialog open={detailDialog === 'conferences'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className={cn(
          "max-w-[95vw] sm:max-w-4xl p-0 gap-0 overflow-hidden rounded-[2.5rem] h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col border-border",
          isDark ? "bg-card border-border" : "bg-card text-primary"
        )}>
          <DialogHeader className={cn(
            "px-6 sm:px-10 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b flex-none",
            isDark ? "bg-muted/30 border-border" : "bg-muted/30 border-border"
          )}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className={cn("text-3xl font-semibold tracking-tight", isDark ? "text-foreground" : "text-primary")}>Histórico de Conferências</DialogTitle>
                  <DialogDescription className={cn("text-sm font-bold", isDark ? "text-muted-foreground" : "text-muted-foreground")}>Linha do tempo detalhada das sessões operacionais</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
              <thead className={cn("sticky top-0 z-20 shadow-sm", isDark ? "bg-card" : "bg-card")}>
                <tr>
                   <th className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-left font-semibold text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Processo</th>
                  <th className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-left font-semibold text-[11px] uppercase tracking-[0.2em] border-b hidden sm:table-cell", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Conferente</th>
                  <th className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-center font-semibold text-[11px] uppercase tracking-[0.2em] border-b hidden xs:table-cell", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Início</th>
                  <th className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-center font-semibold text-[11px] uppercase tracking-[0.2em] border-b hidden md:table-cell", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Fim</th>
                  <th className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-center font-semibold text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Duração</th>
                  <th className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-right font-semibold text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Registros</th>
                  <th className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-center font-semibold text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Análise</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-border" : "divide-border")}>
                {conferenceSummary.map(c => (
                  <tr key={c.id} className={cn("transition-colors group", isDark ? "hover:bg-muted/40" : "hover:bg-muted/40")}>
                    <td className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 font-bold group-hover:text-primary truncate max-w-[120px] sm:max-w-[200px] transition-colors text-sm sm:text-base", isDark ? "text-foreground" : "text-foreground")}>{c.name}</td>
                    <td className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 font-bold truncate max-w-[120px] hidden sm:table-cell", isDark ? "text-muted-foreground" : "text-muted-foreground")}>{c.conferente || '—'}</td>
                    <td className="px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-center font-mono text-success/80 text-[12px] font-bold hidden xs:table-cell">{formatTimeBR(c.startedAt)}</td>
                    <td className={cn("px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-center font-mono text-[12px] font-bold hidden md:table-cell", isDark ? "text-muted-foreground/70" : "text-muted-foreground/70")}>{formatTimeBR(c.finishedAt)}</td>
                    <td className="px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-center">
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-4 py-1 rounded-full border-primary/20 text-primary bg-primary/5")}>{c.duration}</Badge>
                    </td>
                    <td className="px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-right font-mono text-primary font-semibold text-xl">{c.registros}</td>
                    <td className="px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg font-semibold text-[10px] uppercase tracking-wider h-8 px-3"
                        onClick={() => setCompareConferenceId(c.id)}
                        title="Comparar NF × Físico"
                      >
                        NF × Físico
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
          <div className={cn("p-6 border-t flex justify-end flex-none", isDark ? "bg-muted/30 border-border" : "bg-muted/30 border-border")}>
            <Button variant="outline" className={cn("rounded-md font-bold text-sm px-8 h-12 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-[0.97]", isDark ? "border-border text-foreground hover:border-primary" : "border-primary/20 text-primary")} onClick={() => setDetailDialog(null)}>
              Fechar Histórico
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registros Detail Dialog */}
      <Dialog open={detailDialog === 'registros'} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className={cn(
          "max-w-[95vw] sm:max-w-5xl p-0 gap-0 overflow-hidden rounded-[2.5rem] h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col border-border",
          isDark ? "bg-card border-border" : "bg-card text-primary"
        )}>
          <DialogHeader className={cn(
            "px-6 sm:px-10 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b flex-none",
            isDark ? "bg-muted/30 border-border" : "bg-muted/30 border-border"
          )}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
                  <Layers3 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className={cn("text-3xl font-semibold tracking-tight", isDark ? "text-foreground" : "text-primary")}>Histórico de Registros</DialogTitle>
                  <DialogDescription className={cn("text-sm font-bold", isDark ? "text-muted-foreground" : "text-muted-foreground")}>Listagem completa de todos os itens registrados</DialogDescription>
                </div>
              </div>
              
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
              <thead className={cn("sticky top-0 z-20 shadow-sm", isDark ? "bg-card" : "bg-card")}>
                <tr>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-left font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Item / NF</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-left font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b hidden sm:table-cell", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Conferência</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Qtd / Medida</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b hidden md:table-cell", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Endereço</th>
                  <th className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] border-b hidden xs:table-cell", isDark ? "text-muted-foreground border-border" : "text-muted-foreground border-border")}>Data</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-border" : "divide-border")}>
                {allRegistrosDetailed.map((reg, idx) => (
                  <tr key={idx} className={cn("transition-colors group", isDark ? "hover:bg-muted/40" : "hover:bg-muted/40")}>
                    <td className="px-6 sm:px-10 py-4 sm:py-6">
                      <div className="flex flex-col">
                        <span className={cn("font-bold transition-colors text-sm sm:text-base group-hover:text-primary", isDark ? "text-foreground" : "text-foreground")}>
                          {reg.processo || reg.nf || reg.item || 'Item sem identificação'}
                        </span>
                        {reg.item && reg.item !== (reg.processo || reg.nf) && (
                           <span className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-muted-foreground/70" : "text-muted-foreground/60")}>{reg.item}</span>
                        )}
                      </div>
                    </td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 font-bold truncate max-w-[150px] hidden sm:table-cell", isDark ? "text-muted-foreground" : "text-muted-foreground")}>
                      {reg.conferenceName}
                    </td>
                    <td className="px-6 sm:px-10 py-4 sm:py-6 text-right">
                      <div className="text-sm font-semibold text-primary tabular-nums">
                        {formatQty(reg.quantidade || reg.mLinear || reg.m2 || 0)} {reg.modoOrigem === 'madeira' ? 'm' : 'un'}
                      </div>
                    </td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-mono font-bold hidden md:table-cell", isDark ? "text-muted-foreground" : "text-muted-foreground")}>
                      {reg.endereco || '—'}
                    </td>
                    <td className={cn("px-6 sm:px-10 py-4 sm:py-6 text-right font-mono text-[11px] sm:text-[12px] font-bold hidden xs:table-cell", isDark ? "text-muted-foreground/70" : "text-muted-foreground/70")}>
                      {formatDateBR(reg.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
          <div className={cn("p-6 border-t flex justify-end flex-none", isDark ? "bg-muted/30 border-border" : "bg-muted/30 border-border")}>
            <Button variant="outline" className={cn("rounded-md font-bold text-sm px-8 h-12 hover:bg-primary hover:text-white transition-all", isDark ? "border-border text-foreground hover:border-primary" : "border-primary/20 text-primary")} onClick={() => setDetailDialog(null)}>
              Fechar Registros
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
    </>
  );
}
