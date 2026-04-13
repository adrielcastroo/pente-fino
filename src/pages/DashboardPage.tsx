import { Zap, Activity, Download, Users, Layers3, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboard } from '@/hooks/useDashboard';
import { StatCards } from '@/components/dashboard/StatCards';
import { TimelineChart, SummaryChart } from '@/components/dashboard/DashboardCharts';
import { DetailDialog } from '@/components/dashboard/DetailDialog';
import { usePerformance } from '@/hooks/use-performance';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const {
    history,
    stats,
    detailChart,
    setDetailChart,
    handleStatClick,
    handleExport,
    containerVariants,
    itemVariants
  } = useDashboard();

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
      <StatCards 
        stats={stats} 
        onStatClick={handleStatClick} 
        containerVariants={containerVariants} 
        itemVariants={itemVariants} 
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TimelineChart data={stats.timeline} onExport={handleExport} />

        <SummaryChart 
          title="Top Conferentes" 
          desc="Produção Individual" 
          data={stats.topConferentes} 
          type="bar" 
          icon={Users} 
          chartKey="count"
          onDetailClick={setDetailChart} 
        />
        
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
      </div>

      <DetailDialog detailChart={detailChart} onClose={() => setDetailChart(null)} />
    </div>
  );
}