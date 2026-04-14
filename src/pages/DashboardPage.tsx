import { Zap, Activity, Download, Users, Layers3, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboard } from '@/hooks/useDashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatCards } from '@/components/dashboard/StatCards';
import { TimelineChart, SummaryChart } from '@/components/dashboard/DashboardCharts';
import { DetailDialog } from '@/components/dashboard/DetailDialog';

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 sm:space-y-8 lg:space-y-10 max-w-[2000px] mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-5 border-b border-border/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Zap className="w-3.5 h-3.5" />
            <span>Painel de Controle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-lg">
            Acompanhe a produtividade, gerencie fluxos e exporte relatórios.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="outline" className="px-3 py-1.5 rounded-lg border-border/50 text-muted-foreground text-[10px] font-semibold flex gap-2 whitespace-nowrap">
            <Activity className="w-3 h-3 text-primary" />
            <span>Ativo</span>
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
      
      {/* Stat Cards */}
      <StatCards 
        stats={stats} 
        onStatClick={handleStatClick} 
      />

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
          </>
        )}
      </div>

      <DetailDialog detailChart={detailChart} onClose={() => setDetailChart(null)} />
    </div>
  );
}