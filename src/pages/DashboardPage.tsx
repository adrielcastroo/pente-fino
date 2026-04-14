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
  const { isLow } = usePerformance();

  const content = (
    <div className="p-4 sm:p-6 lg:p-10 xl:p-12 space-y-8 sm:space-y-10 lg:space-y-12 max-w-[2000px] mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.25em] text-[10px] sm:text-[11px]">
            <Zap className="w-3.5 h-3.5" />
            <span>Inteligência de Operação</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-foreground leading-[1.1]">
            Dashboard de <span className="text-primary italic">Performance</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium tracking-tight max-w-lg">
            Acompanhe a produtividade em tempo real, gerencie fluxos de conferência e exporte relatórios consolidados.
          </p>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Badge variant="outline" className="px-3 py-2 rounded-xl border-border/40 bg-card/40 text-foreground text-[10px] font-black flex gap-2 shadow-sm border uppercase tracking-widest whitespace-nowrap">
            <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Sistema Ativo</span>
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border-border/40 bg-card/40 backdrop-blur-md hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all shadow-sm" onClick={() => handleExport(history, 'Historico_Geral')}>
                <Download className="w-4 h-5 sm:w-5 sm:h-6" />
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
        containerVariants={isLow ? undefined : containerVariants} 
        itemVariants={isLow ? undefined : itemVariants} 
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
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

  if (isLow) return content;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
}